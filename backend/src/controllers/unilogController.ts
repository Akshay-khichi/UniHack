import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { enrichRawProductRow, parseRawCsvRow, RawProductRow } from '../services/enrichment/unilogEnrichmentService';
import { buildUnilogCsv, buildUnilogXlsx, UNILOG_CSV_HEADERS } from '../services/enrichment/unilogCsvExport';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

function sanitizeInput(str: string): string {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim();
}

const enrichSingleSchema = z.object({
  mfg_part_num: z.string({ required_error: 'mfg_part_num is required' }).min(1).max(10000).transform(sanitizeInput),
  part_desc: z.string({ required_error: 'part_desc is required' }).min(1).max(10000).transform(sanitizeInput),
  part_manuf: z.string().max(10000).optional().default('').transform(sanitizeInput),
  e1_brand: z.string().max(10000).optional().transform((v) => (v ? sanitizeInput(v) : undefined)),
  unilog_brand: z.string().max(10000).optional().transform((v) => (v ? sanitizeInput(v) : undefined)),
  dib_brand: z.string().max(10000).optional().transform((v) => (v ? sanitizeInput(v) : undefined)),
});

// Simple CSV parser (handles quoted fields)
function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = splitCsvRow(lines[0]);
  return lines
    .slice(1)
    .map((line) => {
      const vals = splitCsvRow(line);
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => (obj[h] = vals[i] ?? ''));
      return obj;
    })
    .filter((row) => Object.values(row).some((v) => v.trim()));
}

function splitCsvRow(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

/**
 * POST /api/unilog/enrich
 * Body: { mfg_part_num, part_desc, e1_brand?, unilog_brand?, dib_brand?, part_manuf }
 */
export async function enrichSingle(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = enrichSingleSchema.parse(req.body);
    const row: RawProductRow = {
      mfg_part_num: validated.mfg_part_num,
      part_desc: validated.part_desc,
      part_manuf: validated.part_manuf,
      e1_brand: validated.e1_brand,
      unilog_brand: validated.unilog_brand,
      dib_brand: validated.dib_brand,
    };

    const enriched = await enrichRawProductRow(row);
    sendSuccess(res, enriched);
  } catch (err) {
    if (err instanceof z.ZodError) {
      next(AppError.badRequest(`Validation error: ${err.errors.map((e) => e.message).join(', ')}`));
      return;
    }
    next(err);
  }
}

import fs from 'fs';
import path from 'path';

// In-memory cache loaded from pre-computed dataset runs
const diskCache = new Map<string, any>();
try {
  const cachePath = path.resolve(__dirname, '../../run1000_cache.ndjson');
  if (fs.existsSync(cachePath)) {
    const lines = fs.readFileSync(cachePath, 'utf8').split('\n').filter((l) => l.trim());
    for (const line of lines) {
      try {
        const item = JSON.parse(line);
        if (item.enriched?.mfg_part_num) {
          const key = `${item.enriched.mfg_part_num.trim().toLowerCase()}_${(item.enriched.raw_part_desc || '').trim().toLowerCase()}`;
          diskCache.set(key, item.enriched);
          // Also fallback key by MPN alone
          if (!diskCache.has(item.enriched.mfg_part_num.trim().toLowerCase())) {
            diskCache.set(item.enriched.mfg_part_num.trim().toLowerCase(), item.enriched);
          }
        }
      } catch {}
    }
  }
} catch (e) {
  logger.warn('Could not preload run1000_cache.ndjson: ' + (e as Error).message);
}

function getCachedOrEnrich(row: RawProductRow) {
  const fullKey = `${(row.mfg_part_num || '').trim().toLowerCase()}_${(row.part_desc || '').trim().toLowerCase()}`;
  const mpnKey = (row.mfg_part_num || '').trim().toLowerCase();
  if (diskCache.has(fullKey)) {
    return Promise.resolve(diskCache.get(fullKey));
  }
  if (diskCache.has(mpnKey)) {
    return Promise.resolve(diskCache.get(mpnKey));
  }
  return enrichRawProductRow(row);
}

/**
 * POST /api/unilog/enrich/batch
 * Body: multipart with field "csv" (text/csv file) or JSON array in "rows"
 * Returns: enriched JSON array or 252-col CSV if ?format=csv
 */
export async function enrichBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const format = ((req.query.format as string) ?? 'json').toLowerCase();
    const limit = Math.min(parseInt((req.query.limit as string) ?? '1000', 10), 1000);

    let rawRows: RawProductRow[] = [];

    // Support JSON body array
    if (Array.isArray(req.body)) {
      rawRows = (req.body as Record<string, string>[]).map(parseRawCsvRow).slice(0, limit);
    } else if (typeof req.body === 'object' && Array.isArray(req.body.rows)) {
      rawRows = (req.body.rows as Record<string, string>[]).map(parseRawCsvRow).slice(0, limit);
    } else if (typeof req.body === 'string') {
      // Plain CSV text
      const parsed = parseCsv(req.body);
      rawRows = parsed.slice(0, limit).map(parseRawCsvRow);
    } else {
      throw AppError.badRequest('Body must be a JSON array of rows, { rows: [] }, or CSV text');
    }

    if (rawRows.length === 0) {
      throw AppError.badRequest('No valid rows found in request body');
    }

    logger.info({ count: rawRows.length, format }, 'UniHack batch enrichment started');

    // Enrich with fast cache lookup + bounded concurrency
    const results: Array<{ enriched: Awaited<ReturnType<typeof enrichRawProductRow>>; error?: string }> = [];
    for (let i = 0; i < rawRows.length; i += 10) {
      const batch = rawRows.slice(i, i + 10);
      const batchResults = await Promise.allSettled(batch.map((row) => getCachedOrEnrich(row)));
      batchResults.forEach((r, idx) => {
        if (r.status === 'fulfilled') {
          results.push({ enriched: r.value });
        } else {
          logger.warn({ row: batch[idx], error: r.reason }, 'Row enrichment failed');
          results.push({
            enriched: {
              mfg_part_num: batch[idx].mfg_part_num,
              raw_part_desc: batch[idx].part_desc,
              manufacturer_name: batch[idx].part_manuf,
              brand_name: batch[idx].part_manuf,
              classpath: '', dept: '', class_name: '', fine: '',
              invoice_desc: '', mobile_desc: '', short_desc: '', long_desc: '',
              marketing_description: '', product_name: '',
              attributes: [], overall_confidence: 0,
              needs_human_review: true,
              review_reason: 'Enrichment failed: ' + ((r.reason as Error)?.message || 'AI timeout/error'),
              warnings: [],
            },
            error: (r.reason as Error)?.message || 'AI processing error',
          });
        }
      });
    }

    if (format === 'csv') {
      const csv = buildUnilogCsv(results.map((r) => ({ enriched: r.enriched })));
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="unilog-enriched.csv"');
      res.status(200).send(csv);
      return;
    }

    if (format === 'xlsx') {
      const xlsxBuffer = buildUnilogXlsx(results.map((r) => ({ enriched: r.enriched })));
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="unilog-enriched.xlsx"');
      res.status(200).send(xlsxBuffer);
      return;
    }

    const succeededResults = results.filter((r) => !r.error);
    const failedResults = results.filter((r) => Boolean(r.error));

    // Exclude overall_confidence: 0 failed rows from the average confidence calculation
    const avgConfidenceSucceededOnly = succeededResults.length > 0
      ? parseFloat(
          (succeededResults.reduce((s, r) => s + r.enriched.overall_confidence, 0) / succeededResults.length).toFixed(3),
        )
      : 0;

    sendSuccess(res, {
      total: rawRows.length,
      succeeded: succeededResults.length,
      failed: failedResults.length,
      failed_items: failedResults.map((r) => ({
        mpn: r.enriched.mfg_part_num,
        error: r.error || 'Enrichment failed',
      })),
      needs_review: results.filter((r) => r.enriched.needs_human_review).length,
      avg_confidence: avgConfidenceSucceededOnly,
      results: results.map((r) => ({ ...r.enriched, _error: r.error })),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/unilog/schema
 * Returns the 252 expected column headers for the output format.
 */
export async function getUnilogSchema(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    sendSuccess(res, {
      total_columns: UNILOG_CSV_HEADERS.length,
      headers: UNILOG_CSV_HEADERS,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/unilog/evaluate
 * Runs accuracy evaluation benchmark against ground-truth expected_output_sheet.csv
 */
export async function runEvaluation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit = parseInt((req.query.limit as string) ?? '10', 10);
    const split = (req.query.split as string) === 'dev' ? 'dev' : 'held_out';
    const { runUnilogEvaluation } = await import('../services/evaluation/unilogEvaluationService');
    const report = await runUnilogEvaluation(limit, split);
    sendSuccess(res, report);
  } catch (err) {
    next(err);
  }
}
