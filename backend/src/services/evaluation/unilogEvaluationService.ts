import fs from 'fs';
import path from 'path';
import { parseRawCsvRow, enrichRawProductRow, EnrichedUnilogProduct } from '../enrichment/unilogEnrichmentService';
import { normalizeUom } from '../enrichment/unilogNormalization';
import { logger } from '../../utils/logger';

export interface AccuracyMetric {
  category: string;
  score: number; // 0 - 100 (must equal passed / total * 100 when total > 0, 0 when total === 0)
  passed: number;
  total: number;
  details: string;
}

export interface EvaluationReport {
  overall_score: number;
  timestamp: string;
  dataset_type: 'held_out_validation' | 'dev_tuning';
  dataset_limitation_warning?: string;
  total_rows_sampled: number;
  total_succeeded: number;
  total_failed_excluded: number;
  metrics: AccuracyMetric[];
  benchmark_rows: Array<{
    mpn: string;
    ground_truth_classpath: string;
    predicted_classpath: string;
    classpath_matched: boolean;
    invoice_desc_valid: boolean;
    mobile_desc_valid: boolean;
    enrichment_failed: boolean;
    error_reason?: string;
    overall_row_score: number;
  }>;
}

/**
 * Locate dataset CSV file (sample_input_dataset.csv with 1,000 rows or expected_output_sheet.csv).
 */
function findGroundTruthPath(): string | null {
  const candidates = [
    path.join(process.cwd(), 'sample_input_dataset.csv'),
    path.join(process.cwd(), '../sample_input_dataset.csv'),
    path.join(__dirname, '../../../../sample_input_dataset.csv'),
    path.join(process.cwd(), 'expected_output_sheet.csv'),
    path.join(process.cwd(), '../expected_output_sheet.csv'),
    path.join(__dirname, '../../../../expected_output_sheet.csv'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
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
 * Run evaluation benchmark against dataset items.
 * Splits dataset 50/50 into dev_tuning (rows 0..N/2) and held_out_validation (rows N/2..N).
 */
export async function runUnilogEvaluation(
  limit = 50,
  split: 'dev' | 'held_out' = 'held_out',
): Promise<EvaluationReport> {
  const csvPath = findGroundTruthPath();
  if (!csvPath) {
    throw new Error('Dataset file sample_input_dataset.csv / expected_output_sheet.csv not found');
  }

  const rawContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = rawContent.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) {
    throw new Error('Dataset file contains no data rows');
  }

  const headers = splitCsvRow(lines[0]);
  const allRows = lines.slice(1).map((line) => {
    const vals = splitCsvRow(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h] = vals[i] ?? ''));
    return obj;
  });

  // Split dataset 50/50 into dev tuning set vs held-out validation set
  const midPoint = Math.max(1, Math.floor(allRows.length / 2));
  const candidateRows = split === 'dev' ? allRows.slice(0, midPoint) : allRows.slice(midPoint);
  const rows = candidateRows.slice(0, limit);

  let limitationWarning: string | undefined = undefined;
  if (allRows.length < 10) {
    limitationWarning = `Dataset size (${allRows.length} total rows) is too small for a statistically significant holdout split.`;
  }

  // Classpath accuracy — only scored when ground_truth_classpath is non-empty (exact case-insensitive match)
  let classpathMatchCount = 0;
  let classpathTotalWithGT = 0;
  // Classpath format validity — scored when ground_truth is absent (did the model produce a non-empty X > Y > Z path?)
  let classpathFormatValidCount = 0;
  let classpathFormatTotalNoGT = 0;

  let invoiceDescValid = 0;
  let mobileDescValid = 0;
  let placeholderCleanedPass = 0;
  let placeholderTotalEligible = 0;
  let uomStandardizedPass = 0;
  let uomTotalChecked = 0;

  let totalSucceeded = 0;
  let totalFailedExcluded = 0;

  const benchmarkRows: EvaluationReport['benchmark_rows'] = [];

  for (const row of rows) {
    const mpn = row['Mfg_Part_Num'] || row['MANUFACTURER_PART_NUMBER'] || 'UNKNOWN';
    const gtClasspath = row['Classpath'] || '';

    // Simulate raw row for enrichment
    const rawRow = parseRawCsvRow({
      Mfg_Part_Num: mpn,
      Part_Desc: row['Part_Desc'] || row['SHORT_DESC'] || '',
      Part_Manuf: row['MANUFACTURER_NAME'] || row['Part_Manuf'] || '',
      E1_Brand: row['E1_Brand'],
      Unilog_Brand: row['Unilog_Brand'],
      DIB_Brand: row['DIB_Brand'],
    });

    let enriched: EnrichedUnilogProduct | null = null;
    let errorReason: string | undefined = undefined;

    try {
      enriched = await enrichRawProductRow(rawRow);
      totalSucceeded++;
    } catch (err) {
      totalFailedExcluded++;
      errorReason = (err as Error)?.message || 'AI enrichment failed';
      logger.warn({ mpn, error: errorReason }, 'Evaluation benchmark row failed — excluding from metric denominator');

      // EXCLUDE failed rows from placeholder/UOM scoring — do not count as passed, do not count in denominator
      benchmarkRows.push({
        mpn,
        ground_truth_classpath: gtClasspath,
        predicted_classpath: '[FAILED_ENRICHMENT]',
        classpath_matched: false,
        invoice_desc_valid: false,
        mobile_desc_valid: false,
        enrichment_failed: true,
        error_reason: errorReason,
        overall_row_score: 0,
      });
      continue;
    }

    const predClasspath = enriched.classpath;
    const rowInvoiceDesc = enriched.invoice_desc;
    const rowMobileDesc = enriched.mobile_desc;

    // Classpath accuracy: only when ground truth is available — EXACT case-insensitive full-path match only.
    // Classpath format validity: when GT is absent — model produced a non-empty multi-segment path.
    let cpMatched: boolean;
    if (gtClasspath.length > 0) {
      classpathTotalWithGT++;
      cpMatched = predClasspath.toLowerCase().trim() === gtClasspath.toLowerCase().trim();
      if (cpMatched) classpathMatchCount++;
    } else {
      classpathFormatTotalNoGT++;
      cpMatched = predClasspath.length > 0 && predClasspath.includes('>');
      if (cpMatched) classpathFormatValidCount++;
    }

    // Check INVOICE_DESC constraint (<= 40 chars, ALL CAPS)
    const invValid = rowInvoiceDesc.length > 0 && rowInvoiceDesc.length <= 40 && rowInvoiceDesc === rowInvoiceDesc.toUpperCase();
    if (invValid) invoiceDescValid++;

    // Check MOBILE_DESC constraint (non-empty, <= 80 chars)
    const mobValid = rowMobileDesc.length > 0 && rowMobileDesc.length <= 80;
    if (mobValid) mobileDescValid++;

    // FORMULA FIX: Only check placeholder cleaning on SUCCEEDED rows that had placeholders in raw input
    const rawBrand = row['E1_Brand'] || row['Unilog_Brand'] || row['DIB_Brand'] || '';
    const hasRawPlaceholder =
      rawBrand.includes('--') || rawBrand.toLowerCase().includes('unbranded') || rawBrand.toLowerCase().includes('n/a');
    if (hasRawPlaceholder) {
      placeholderTotalEligible++;
      const predBrand = enriched.brand_name || '';
      const isClean =
        predBrand.length > 0 &&
        !predBrand.includes('--') &&
        !predBrand.toLowerCase().includes('unbranded') &&
        !predBrand.toLowerCase().includes('n/a');
      if (isClean) {
        placeholderCleanedPass++;
      }
    }

    // FORMULA FIX: Only check UOM standardization on SUCCEEDED rows with extracted attribute UOMs
    if (enriched.attributes && enriched.attributes.length > 0) {
      for (const attr of enriched.attributes) {
        if (attr.uom && attr.uom.trim().length > 0) {
          uomTotalChecked++;
          if (attr.uom === normalizeUom(attr.uom)) {
            uomStandardizedPass++;
          }
        }
      }
    }

    const rowScore = Math.round(
      ((cpMatched ? 1 : 0) + (invValid ? 1 : 0) + (mobValid ? 1 : 0)) / 3 * 100,
    );

    benchmarkRows.push({
      mpn,
      ground_truth_classpath: gtClasspath,
      predicted_classpath: predClasspath,
      classpath_matched: cpMatched,
      invoice_desc_valid: invValid,
      mobile_desc_valid: mobValid,
      enrichment_failed: false,
      overall_row_score: rowScore,
    });
  }

  // Denominator is succeeded rows count (excluding failed AI calls)
  const denom = totalSucceeded;

  // FORMULA VERIFICATION: score MUST equal passed / total * 100 when total > 0, 0 when total === 0
  const metrics: AccuracyMetric[] = [
    {
      // Only counts rows where a ground-truth classpath exists in the CSV; uses EXACT full-path case-insensitive match.
      category: 'Taxonomy Classpath Accuracy (GT rows only)',
      score: classpathTotalWithGT > 0 ? Math.round((classpathMatchCount / classpathTotalWithGT) * 100) : 0,
      passed: classpathMatchCount,
      total: classpathTotalWithGT,
      details:
        classpathTotalWithGT === 0
          ? 'No ground-truth classpaths found in dataset — accuracy cannot be computed'
          : 'Exact case-insensitive full-path match: predicted === ground_truth',
    },
    {
      // Counts rows where no ground truth exists; checks only that the model produced a non-empty "A > B > C" path.
      category: 'Classpath Format Validity (no-GT rows)',
      score: classpathFormatTotalNoGT > 0 ? Math.round((classpathFormatValidCount / classpathFormatTotalNoGT) * 100) : 0,
      passed: classpathFormatValidCount,
      total: classpathFormatTotalNoGT,
      details: 'Model produced a non-empty multi-segment classpath ("A > B > C") when no ground truth was available',
    },
    {
      category: 'INVOICE_DESC Compliance',
      score: denom > 0 ? Math.round((invoiceDescValid / denom) * 100) : 0,
      passed: invoiceDescValid,
      total: denom,
      details: 'Strict constraint: ≤40 characters and ALL CAPS shorthand',
    },
    {
      category: 'MOBILE_DESC Formatting',
      score: denom > 0 ? Math.round((mobileDescValid / denom) * 100) : 0,
      passed: mobileDescValid,
      total: denom,
      details: 'Strict constraint: ≤80 characters mobile-optimized format',
    },
    {
      category: 'Placeholder Cleaning',
      score: placeholderTotalEligible > 0 ? Math.round((placeholderCleanedPass / placeholderTotalEligible) * 100) : 0,
      passed: placeholderCleanedPass,
      total: placeholderTotalEligible,
      details: 'Filtering out "-- Unbranded --", "-- No Unilog Brand --" etc.',
    },
    {
      category: 'UOM Standardization',
      score: uomTotalChecked > 0 ? Math.round((uomStandardizedPass / uomTotalChecked) * 100) : 0,
      passed: uomStandardizedPass,
      total: uomTotalChecked,
      details: 'Approved Unilog unit abbreviations & number spacing ("24 in")',
    },
  ];

  const validMetricScores = metrics.filter((m) => m.total > 0).map((m) => m.score);
  const overall =
    validMetricScores.length > 0
      ? Math.round(validMetricScores.reduce((acc, s) => acc + s, 0) / validMetricScores.length)
      : 0;

  return {
    overall_score: overall,
    timestamp: new Date().toISOString(),
    dataset_type: split === 'held_out' ? 'held_out_validation' : 'dev_tuning',
    ...(limitationWarning && { dataset_limitation_warning: limitationWarning }),
    total_rows_sampled: rows.length,
    total_succeeded: totalSucceeded,
    total_failed_excluded: totalFailedExcluded,
    metrics,
    benchmark_rows: benchmarkRows,
  };
}
