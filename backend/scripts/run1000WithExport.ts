import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { UNILOG_ENRICHMENT_PROMPT } from '../src/prompts/unilogEnrichmentPrompt';
import { parseGeminiJson } from '../src/utils/jsonParser';
import { cleanPlaceholder, parseManufacturerField, normalizeUom } from '../src/services/enrichment/unilogNormalization';
import { buildUnilogCsv, buildUnilogXlsx, mapToUnilogRow, UNILOG_CSV_HEADERS } from '../src/services/enrichment/unilogCsvExport';
import { EnrichedUnilogProduct, RawProductRow, UnilogAttribute } from '../src/services/enrichment/unilogEnrichmentService';

const CACHE_FILE = path.resolve(__dirname, '../run1000_cache.ndjson');
const CSV_OUT = path.resolve(__dirname, '../run1000_output.csv');
const XLSX_OUT = path.resolve(__dirname, '../run1000_output.xlsx');
const DELIVERY_CSV = path.resolve(__dirname, '../output_delivery_format.csv');
const DELIVERY_XLSX = path.resolve(__dirname, '../output_delivery_format.xlsx');

// -----------------------------------------------------------------------------
// MULTI-KEY POOL MANAGER
// -----------------------------------------------------------------------------

interface KeySlot {
  id: number;
  name: string;
  key: string;
  client: GoogleGenAI;
  lastCallTimestamp: number;
  rateLimitBackoffUntil: number;
  isExhaustedDaily: boolean;
  exhaustedReason: string | null;
  completedCount: number;
  failedCount: number;
}

const MIN_KEY_INTERVAL_MS = 4200; // ~14 RPM per key

class MultiKeyManager {
  private slots: KeySlot[] = [];
  private nextIndex = 0;

  constructor() {
    const rawKeys = [
      { id: 1, name: 'KEY 1 (GEMINI_API_KEY)', key: process.env.GEMINI_API_KEY },
      { id: 2, name: 'KEY 2 (GEMINI_API_KEY_2)', key: process.env.GEMINI_API_KEY_2 },
      { id: 3, name: 'KEY 3 (GEMINI_API_KEY_3)', key: process.env.GEMINI_API_KEY_3 },
      { id: 4, name: 'KEY 4 (GEMINI_API_KEY_4)', key: process.env.GEMINI_API_KEY_4 },
    ];

    for (const rk of rawKeys) {
      const k = (rk.key || '').trim();
      if (k && k !== 'YOUR_GEMINI_API_KEY_HERE') {
        this.slots.push({
          id: rk.id,
          name: rk.name,
          key: k,
          client: new GoogleGenAI({ apiKey: k }),
          lastCallTimestamp: 0,
          rateLimitBackoffUntil: 0,
          isExhaustedDaily: false,
          exhaustedReason: null,
          completedCount: 0,
          failedCount: 0,
        });
      }
    }

    if (this.slots.length === 0) {
      throw new Error('No valid Gemini API keys found in environment');
    }
  }

  getActiveKeyCount(): number {
    return this.slots.filter(s => !s.isExhaustedDaily).length;
  }

  getSlotSummary(): string {
    return this.slots.map(s => {
      let status = 'ACTIVE';
      if (s.isExhaustedDaily) {
        status = `EXHAUSTED (${s.exhaustedReason || 'Daily cap'})`;
      } else if (Date.now() < s.rateLimitBackoffUntil) {
        const remainingSec = Math.ceil((s.rateLimitBackoffUntil - Date.now()) / 1000);
        status = `RPM_BACKOFF (${remainingSec}s left)`;
      }
      return `${s.name}: ${s.completedCount} completed | Status: ${status}`;
    }).join(' | ');
  }

  getPerKeyBreakdown(): Array<{ id: number; name: string; completed: number; status: string; reason: string | null }> {
    return this.slots.map(s => {
      let status = 'ACTIVE';
      if (s.isExhaustedDaily) {
        status = 'DAILY_EXHAUSTED';
      } else if (Date.now() < s.rateLimitBackoffUntil) {
        status = 'RPM_BACKOFF';
      }
      return {
        id: s.id,
        name: s.name,
        completed: s.completedCount,
        status,
        reason: s.exhaustedReason,
      };
    });
  }

  async acquireAvailableSlot(): Promise<KeySlot> {
    const activeSlots = this.slots.filter(s => !s.isExhaustedDaily);
    if (activeSlots.length === 0) {
      throw new Error('ALL_KEYS_EXHAUSTED: All configured API keys have reached their daily quota limits.');
    }

    // Try finding a slot that is ready immediately or has the shortest wait
    while (true) {
      const now = Date.now();
      const eligibleSlots = this.slots.filter(s => !s.isExhaustedDaily && now >= s.rateLimitBackoffUntil);

      if (eligibleSlots.length === 0) {
        // All active slots are in temporary RPM backoff — find shortest wait
        const nextWake = Math.min(...this.slots.filter(s => !s.isExhaustedDaily).map(s => s.rateLimitBackoffUntil));
        const waitMs = Math.max(1000, nextWake - now + 100);
        await new Promise(r => setTimeout(r, waitMs));
        continue;
      }

      // Round-robin selection among eligible slots
      for (let attempt = 0; attempt < eligibleSlots.length; attempt++) {
        const slot = eligibleSlots[(this.nextIndex + attempt) % eligibleSlots.length];
        const elapsedSinceLast = now - slot.lastCallTimestamp;

        if (elapsedSinceLast >= MIN_KEY_INTERVAL_MS) {
          this.nextIndex = (this.nextIndex + attempt + 1) % eligibleSlots.length;
          slot.lastCallTimestamp = Date.now();
          return slot;
        }
      }

      // If all eligible slots need pacing, pick the one closest to becoming ready
      let minPacingWait = MIN_KEY_INTERVAL_MS;
      for (const slot of eligibleSlots) {
        const timeUntilReady = MIN_KEY_INTERVAL_MS - (now - slot.lastCallTimestamp);
        if (timeUntilReady < minPacingWait) {
          minPacingWait = timeUntilReady;
        }
      }

      await new Promise(r => setTimeout(r, Math.max(100, minPacingWait)));
    }
  }

  handleCallSuccess(slot: KeySlot) {
    slot.completedCount++;
  }

  handleCallFailure(slot: KeySlot, error: Error) {
    slot.failedCount++;
    const msg = error.message || '';

    if (msg.includes('GenerateRequestsPerDay') || msg.includes('limit: 500')) {
      slot.isExhaustedDaily = true;
      slot.exhaustedReason = 'Daily 500 RPD cap reached';
      console.log(`[MULTI-KEY] ${slot.name} HIT DAILY CAP — disabling slot for this run.`);
    } else if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('GenerateRequestsPerMinute')) {
      slot.rateLimitBackoffUntil = Date.now() + 42000;
      console.log(`[MULTI-KEY] ${slot.name} hit 15 RPM limit — backoff for 42s.`);
    }
  }
}

// -----------------------------------------------------------------------------
// ENRICHMENT FUNCTION WITH MULTI-KEY RETRY
// -----------------------------------------------------------------------------

function resolveBrand(row: RawProductRow): string | null {
  const candidates = [row.unilog_brand, row.dib_brand, row.e1_brand];
  for (const c of candidates) {
    if (!c) continue;
    const cleaned = cleanPlaceholder(c);
    if (cleaned) return cleaned;
  }
  return null;
}

async function enrichWithMultiKey(
  row: RawProductRow,
  keyManager: MultiKeyManager
): Promise<EnrichedUnilogProduct> {
  const { name: manufName } = parseManufacturerField(row.part_manuf);
  const resolvedBrand = resolveBrand(row);

  const prompt = `${UNILOG_ENRICHMENT_PROMPT}

RAW PRODUCT ROW:
- Mfg_Part_Num: ${row.mfg_part_num}
- Part_Desc: ${row.part_desc}
- Part_Manuf (Supplier/Distributor): ${manufName}
- Cleaned_Brand: ${resolvedBrand ?? 'Unknown'}`;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= 6; attempt++) {
    let slot: KeySlot;
    try {
      slot = await keyManager.acquireAvailableSlot();
    } catch (err: any) {
      throw err; // All keys exhausted
    }

    try {
      const result = await Promise.race([
        slot.client.models.generateContent({
          model: 'gemini-flash-lite-latest',
          contents: prompt,
          config: { temperature: 0.1, maxOutputTokens: 8192 },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Enrichment timeout (45s)')), 45000)
        ),
      ]);

      const rawText = result.text ?? '';
      const parsed = parseGeminiJson<Record<string, unknown>>(rawText);

      if (!parsed.success) {
        lastError = new Error(parsed.error);
        if (attempt < 6) await new Promise(r => setTimeout(r, 1000 * attempt));
        continue;
      }

      keyManager.handleCallSuccess(slot);

      const d = parsed.data;
      const rawAttributes = Array.isArray(d.attributes) ? d.attributes : [];

      const attributes: UnilogAttribute[] = rawAttributes
        .slice(0, 20)
        .map((a: Record<string, unknown>) => ({
          label: String(a.label ?? ''),
          value: String(a.value ?? ''),
          uom: a.uom ? normalizeUom(String(a.uom)) : null,
          confidence: Math.min(1, Math.max(0, Number(a.confidence ?? 0.7))),
        }))
        .filter((a: UnilogAttribute) => a.label && a.value);

      // Resolve true product manufacturer and brand — never default to distributor
      const rawDistributor = manufName.trim().toLowerCase();
      let extractedManuf = d.manufacturer_name ? String(d.manufacturer_name).trim() : '';
      let extractedBrand = d.brand_name ? String(d.brand_name).trim() : (resolvedBrand ?? '');

      if (extractedManuf.toLowerCase() === rawDistributor && !row.part_desc.toLowerCase().includes(rawDistributor)) {
        extractedManuf = '';
      }
      if (extractedBrand.toLowerCase() === rawDistributor && !row.part_desc.toLowerCase().includes(rawDistributor)) {
        extractedBrand = '';
      }

      const isManufUngrounded = !extractedManuf;
      const isBrandUngrounded = !extractedBrand;

      const overallConf = Number(d.overall_confidence ?? 0.7);
      const lowConfAttributes = attributes.filter(a => a.confidence < 0.6);
      const hasAnyLowConfAttribute = lowConfAttributes.length > 0;

      const needsReview =
        Boolean(d.needs_human_review) ||
        overallConf < 0.6 ||
        hasAnyLowConfAttribute ||
        isManufUngrounded ||
        isBrandUngrounded;

      const reviewReasons: string[] = [];
      if (d.review_reason) reviewReasons.push(String(d.review_reason));
      if (overallConf < 0.6) reviewReasons.push(`Overall confidence (${overallConf.toFixed(2)}) is below 0.6 threshold`);
      if (hasAnyLowConfAttribute) {
        reviewReasons.push(`Contains ${lowConfAttributes.length} attribute(s) below 0.6 confidence threshold`);
      }
      if (isManufUngrounded) reviewReasons.push('Manufacturer is ungroundable from input');
      if (isBrandUngrounded) reviewReasons.push('Brand is ungroundable from input');

      let invoiceDesc = String(d.invoice_desc ?? '').toUpperCase();
      if (invoiceDesc.length > 40) invoiceDesc = invoiceDesc.substring(0, 40).trim();

      return {
        mfg_part_num: row.mfg_part_num,
        raw_part_desc: row.part_desc,
        manufacturer_name: extractedManuf,
        brand_name: extractedBrand,
        classpath: String(d.classpath ?? ''),
        dept: String(d.dept ?? ''),
        class_name: String(d.class ?? ''),
        fine: String(d.fine ?? ''),
        invoice_desc: invoiceDesc,
        mobile_desc: String(d.mobile_desc ?? '').substring(0, 80),
        short_desc: String(d.short_desc ?? ''),
        long_desc: String(d.long_desc ?? ''),
        marketing_description: String(d.marketing_description ?? ''),
        product_name: String(d.product_name ?? ''),
        attributes,
        overall_confidence: overallConf,
        needs_human_review: needsReview,
        review_reason: reviewReasons.length > 0 ? reviewReasons.join('; ') : null,
        warnings: Array.isArray(d.warnings) ? d.warnings.map(String) : [],
      };
    } catch (err: any) {
      lastError = err as Error;
      keyManager.handleCallFailure(slot, lastError);
      if (attempt < 6) await new Promise(r => setTimeout(r, 1000));
    }
  }

  throw new Error(`Enrichment failed after 6 attempts: ${lastError?.message}`);
}

// -----------------------------------------------------------------------------
// CSV & EXPORT HELPERS
// -----------------------------------------------------------------------------

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

function exportAll() {
  if (!fs.existsSync(CACHE_FILE)) {
    console.log('[EXPORT] No cache file found.');
    return { rowCount: 0, csvSize: 0, xlsxSize: 0 };
  }

  const lines = fs.readFileSync(CACHE_FILE, 'utf8').split('\n').filter(l => l.trim());
  const items: Array<{ enriched: EnrichedUnilogProduct; original: Record<string, string> }> = [];

  for (const line of lines) {
    try {
      items.push(JSON.parse(line));
    } catch {}
  }

  if (items.length === 0) {
    console.log('[EXPORT] Cache is empty.');
    return { rowCount: 0, csvSize: 0, xlsxSize: 0 };
  }

  const csvContent = buildUnilogCsv(items);
  fs.writeFileSync(CSV_OUT, csvContent, 'utf8');
  fs.writeFileSync(DELIVERY_CSV, csvContent, 'utf8');
  const csvStats = fs.statSync(CSV_OUT);

  const xlsxBuffer = buildUnilogXlsx(items);
  fs.writeFileSync(XLSX_OUT, xlsxBuffer);
  fs.writeFileSync(DELIVERY_XLSX, xlsxBuffer);
  const xlsxStats = fs.statSync(XLSX_OUT);

  const dataLines = csvContent.split('\r\n').length - 1;

  console.log(`\n[EXPORT] Total rows exported: ${items.length}`);
  console.log(`[EXPORT] CSV: ${CSV_OUT} | Size: ${csvStats.size} bytes | Data rows: ${dataLines} | Cols: ${UNILOG_CSV_HEADERS.length}`);
  console.log(`[EXPORT] XLSX: ${XLSX_OUT} | Size: ${xlsxStats.size} bytes | Data rows: ${items.length} | Cols: ${UNILOG_CSV_HEADERS.length}`);

  return { rowCount: items.length, csvSize: csvStats.size, xlsxSize: xlsxStats.size };
}

// -----------------------------------------------------------------------------
// MAIN WORKFLOW
// -----------------------------------------------------------------------------

async function main() {
  const startTime = Date.now();
  console.log(`[START] ${new Date().toISOString()} | Multi-Key 1000-Row Pipeline`);

  const keyManager = new MultiKeyManager();
  console.log(`[MULTI-KEY] Active keys available: ${keyManager.getActiveKeyCount()}`);
  console.log(`[MULTI-KEY] Initial status: ${keyManager.getSlotSummary()}`);

  const inputCsvPath = path.resolve(__dirname, '../../sample_input_dataset.csv');
  const inputRaw = fs.readFileSync(inputCsvPath, 'utf8');
  const inputLines = inputRaw.split(/\r?\n/).filter(l => l.trim());
  const inputHeaders = splitCsvRow(inputLines[0]);

  const allRows = inputLines.slice(1).map((line, idx) => {
    const vals = splitCsvRow(line);
    const obj: Record<string, string> = {};
    inputHeaders.forEach((h, i) => (obj[h] = vals[i] ?? ''));
    return { rowNum: idx + 1, data: obj };
  });

  console.log(`[DATASET] Total catalog rows: ${allRows.length}`);

  // Load existing cache
  const cachedMpns = new Set<string>();
  if (fs.existsSync(CACHE_FILE)) {
    const existing = fs.readFileSync(CACHE_FILE, 'utf8').split('\n').filter(l => l.trim());
    for (const line of existing) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.enriched?.mfg_part_num) cachedMpns.add(parsed.enriched.mfg_part_num);
      } catch {}
    }
  }
  console.log(`[CACHE] ${cachedMpns.size} rows already completed in cache. Skipping those.`);

  const cacheStream = fs.createWriteStream(CACHE_FILE, { flags: 'a' });

  let succeeded = cachedMpns.size;
  let failed = 0;
  const failedRows: Array<{ rowNum: number; mpn: string; error: string }> = [];

  const CHECKPOINTS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 120].map(m => m * 60 * 1000);
  const reportedCheckpoints = new Set<number>();

  const maybeReportCheckpoint = () => {
    const elapsed = Date.now() - startTime;
    for (const cp of CHECKPOINTS) {
      if (elapsed >= cp && !reportedCheckpoints.has(cp)) {
        reportedCheckpoints.add(cp);
        const mins = Math.round(cp / 60000);
        const newRowsDone = succeeded - cachedMpns.size;
        const ratePerMin = elapsed > 0 ? (newRowsDone / (elapsed / 60000)) : 0;
        const remaining = allRows.length - succeeded;
        const etaMins = ratePerMin > 0 ? (remaining / ratePerMin).toFixed(0) : 'N/A';

        console.log(`\n[CHECKPOINT ${mins}min] ${new Date().toISOString()}`);
        console.log(`Total Progress: ${succeeded}/${allRows.length} (${((succeeded / allRows.length) * 100).toFixed(1)}%) | Failed: ${failed}`);
        console.log(`New Throughput: ${ratePerMin.toFixed(1)} rows/min | Remaining ETA: ~${etaMins} min`);
        console.log(`Per-Key Breakdown: ${keyManager.getSlotSummary()}\n`);
      }
    }
  };

  for (let i = 0; i < allRows.length; i++) {
    const item = allRows[i];
    const rawInput = {
      mfg_part_num: (item.data['Mfg_Part_Num'] || '').trim(),
      part_desc: (item.data['Part_Desc'] || '').trim(),
      part_manuf: (item.data['Part_Manuf'] || '').trim(),
      e1_brand: (item.data['E1_Brand'] || '').trim() || undefined,
      unilog_brand: (item.data['Unilog_Brand'] || '').trim() || undefined,
      dib_brand: (item.data['DIB_Brand'] || '').trim() || undefined,
    };

    if (cachedMpns.has(rawInput.mfg_part_num)) {
      maybeReportCheckpoint();
      continue;
    }

    try {
      const enriched = await enrichWithMultiKey(rawInput, keyManager);
      const outputRow = mapToUnilogRow(enriched, item.data);

      cacheStream.write(JSON.stringify({ enriched, original: item.data, outputRow }) + '\n');
      succeeded++;
      cachedMpns.add(rawInput.mfg_part_num);

      const elapsed = Date.now() - startTime;
      const elapsedMin = (elapsed / 60000).toFixed(1);
      console.log(`[ROW OK] ${new Date().toISOString()} | Row ${item.rowNum}/1000 | MPN: ${rawInput.mfg_part_num} | Elapsed: ${elapsedMin}min | Total: ${succeeded}/1000`);
    } catch (err: any) {
      failed++;
      const errMsg = (err as Error).message ?? 'Unknown error';
      failedRows.push({ rowNum: item.rowNum, mpn: rawInput.mfg_part_num, error: errMsg });
      console.log(`[ROW FAIL] ${new Date().toISOString()} | Row ${item.rowNum} | MPN: ${rawInput.mfg_part_num} | Error: ${errMsg.slice(0, 120)}`);

      if (errMsg.includes('ALL_KEYS_EXHAUSTED')) {
        console.log('\n[CRITICAL] All configured API keys have been exhausted. Stopping run.');
        break;
      }
    }

    maybeReportCheckpoint();
  }

  cacheStream.end();

  const elapsedTotal = Date.now() - startTime;
  const elapsedMinTotal = (elapsedTotal / 60000).toFixed(1);

  console.log(`\n[FINAL PIPELINE REPORT] ${new Date().toISOString()}`);
  console.log(`Elapsed Time: ${elapsedMinTotal} minutes`);
  console.log(`Total Dataset Rows: ${allRows.length}`);
  console.log(`Rows Succeeded: ${succeeded}/${allRows.length} (${((succeeded / allRows.length) * 100).toFixed(1)}%)`);
  console.log(`Rows Failed: ${failed}`);
  console.log(`Per-Key Final Breakdown: ${keyManager.getSlotSummary()}`);

  if (failedRows.length > 0) {
    console.log('\n[FAILED ROWS LIST]');
    for (const r of failedRows) {
      console.log(`  Row ${r.rowNum} (MPN: ${r.mpn}): ${r.error.slice(0, 150)}`);
    }
  }

  console.log('\n[GENERATING FINAL CSV AND XLSX EXPORTS]');
  const expRes = exportAll();

  if (expRes.rowCount === succeeded) {
    console.log(`\n[VERIFIED] rows completed (${succeeded}) === rows in export (${expRes.rowCount}) -- PASS`);
  } else {
    console.log(`\n*** MISMATCH: rows completed (${succeeded}) !== rows in export (${expRes.rowCount}) ***`);
  }
}

main().catch(err => {
  console.error('Fatal error in multi-key pipeline:', err);
  exportAll();
  process.exit(1);
});
