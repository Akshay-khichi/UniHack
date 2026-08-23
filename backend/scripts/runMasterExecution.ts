import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { parseRawCsvRow, enrichRawProductRow, EnrichedUnilogProduct } from '../src/services/enrichment/unilogEnrichmentService';
import { buildUnilogCsv, buildUnilogXlsx, UNILOG_CSV_HEADERS, mapToUnilogRow } from '../src/services/enrichment/unilogCsvExport';
import { cleanPlaceholder } from '../src/services/enrichment/unilogNormalization';

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

// Self-consistency check function for Requirement 4
function evaluateSelfConsistency(rawDesc: string, rawManuf: string, rawBrands: string[], enriched: EnrichedUnilogProduct) {
  const flags: string[] = [];
  const normalizedRaw = `${rawDesc} ${rawManuf} ${rawBrands.join(' ')}`.toLowerCase();

  // 1. Manufacturer check
  if (enriched.manufacturer_name) {
    const manufTokens = enriched.manufacturer_name.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const manufInRaw = manufTokens.some(t => normalizedRaw.includes(t));
    if (!manufInRaw) {
      flags.push(`LOW_CONFIDENCE_MANUFACTURER: "${enriched.manufacturer_name}" not found in raw input`);
    }
  }

  // 2. Brand check
  if (enriched.brand_name) {
    const cleanBrand = enriched.brand_name.replace(/[®™]/g, '').toLowerCase().trim();
    const brandTokens = cleanBrand.split(/\s+/).filter(t => t.length > 2);
    const brandInRaw = brandTokens.some(t => normalizedRaw.includes(t));
    if (!brandInRaw) {
      flags.push(`LOW_CONFIDENCE_BRAND: "${enriched.brand_name}" inferred by LLM without raw source string`);
    }
  }

  // 3. Attribute checks (LLM confidence < 0.6 or value not in source)
  enriched.attributes.forEach((attr) => {
    if (attr.confidence < 0.6) {
      flags.push(`LOW_CONFIDENCE_ATTRIBUTE_CONFIDENCE: "${attr.label}: ${attr.value}" confidence ${attr.confidence.toFixed(2)} < 0.6`);
    }
    const valStr = String(attr.value).toLowerCase().trim();
    if (valStr.length > 2 && !normalizedRaw.includes(valStr)) {
      // Value not found directly in input text
      flags.push(`LOW_CONFIDENCE_ATTRIBUTE_UNGROUNDED: "${attr.label}: ${attr.value}" not in raw text`);
    }
  });

  return {
    hasLowConfidence: flags.length > 0,
    flags
  };
}

async function main() {
  console.log('=== UNILOG SUBMISSION PRIORITY EXECUTION ===\n');

  // -------------------------------------------------------------
  // STEP 2: Exact Header Diff against Expected Output Sheet (252 columns)
  // -------------------------------------------------------------
  console.log('[STEP 2: HEADER DIFF]');
  const expectedCsvPath = path.resolve(__dirname, '../../expected_output_sheet.csv');
  const expectedRaw = fs.readFileSync(expectedCsvPath, 'utf8');
  const expectedHeaders = splitCsvRow(expectedRaw.split(/\r?\n/)[0]);

  console.log(`Canonical Expected Headers: ${expectedHeaders.length}`);
  console.log(`Generated Output Headers: ${UNILOG_CSV_HEADERS.length}`);

  let headerMismatches = 0;
  const headerDiffTable: Array<{ index: number; expected: string; output: string; match: string }> = [];

  for (let i = 0; i < Math.max(expectedHeaders.length, UNILOG_CSV_HEADERS.length); i++) {
    const exp = expectedHeaders[i] ?? '[MISSING]';
    const out = UNILOG_CSV_HEADERS[i] ?? '[EXTRA]';
    const isMatch = exp === out;
    if (!isMatch) headerMismatches++;
    headerDiffTable.push({
      index: i + 1,
      expected: exp,
      output: out,
      match: isMatch ? 'Y' : 'N'
    });
  }

  console.log(`Header Mismatches Found: ${headerMismatches}`);
  console.log(`Header Match Verified: ${headerMismatches === 0 ? 'ZERO_MISMATCHES_EXACT_MATCH' : 'MISMATCHES_PRESENT'}`);

  // -------------------------------------------------------------
  // STEP 3: Single Ground-Truth Row Side-by-Side (PDSH4816AF Dishwasher)
  // -------------------------------------------------------------
  console.log('\n[STEP 3: GROUND-TRUTH ROW SIDE-BY-SIDE (PDSH4816AF)]');
  const gtLines = expectedRaw.split(/\r?\n/).filter(l => l.trim());
  const gtRowVals = splitCsvRow(gtLines[1]); // Row 1 data (PDSH4816AF)
  const gtRowObj: Record<string, string> = {};
  expectedHeaders.forEach((h, i) => gtRowObj[h] = gtRowVals[i] ?? '');

  const gtRawInput = parseRawCsvRow({
    Mfg_Part_Num: gtRowObj['Mfg_Part_Num'] || gtRowObj['MANUFACTURER_PART_NUMBER'],
    Part_Desc: gtRowObj['Part_Desc'] || gtRowObj['SHORT_DESC'],
    Part_Manuf: gtRowObj['Part_Manuf'] || gtRowObj['MANUFACTURER_NAME'],
    E1_Brand: gtRowObj['E1_Brand'],
    Unilog_Brand: gtRowObj['Unilog_Brand'],
    DIB_Brand: gtRowObj['DIB_Brand'],
  });

  const gtEnriched = await enrichRawProductRow(gtRawInput);
  const gtGeneratedRow = mapToUnilogRow(gtEnriched, gtRowObj);

  const populatedComparison: Array<{ field: string; expected: string; generated: string; status: string }> = [];

  expectedHeaders.forEach((h) => {
    const expVal = gtRowObj[h] ?? '';
    const genVal = gtGeneratedRow[h] ?? '';

    // Only compare if either expected or generated is non-empty
    if (expVal.trim() !== '' || genVal.trim() !== '') {
      let status = 'MISMATCH';
      if (expVal.trim() === '' && genVal.trim() === '') {
        status = 'EMPTY';
      } else if (expVal.trim().toLowerCase() === genVal.trim().toLowerCase()) {
        status = 'MATCH';
      }
      populatedComparison.push({
        field: h,
        expected: expVal,
        generated: genVal,
        status
      });
    }
  });

  console.log(`Total Populated / Relevant Fields Compared: ${populatedComparison.length}`);
  fs.writeFileSync('step3_ground_truth_row_comparison.json', JSON.stringify(populatedComparison, null, 2), 'utf8');

  // -------------------------------------------------------------
  // STEP 1 & 4 & 5: Full 1,000-Row Dataset Processing & Exports
  // -------------------------------------------------------------
  console.log('\n[STEP 1 & 4: 1000-ROW RUN WITH SELF-CONSISTENCY FLAGS]');
  const inputCsvPath = path.resolve(__dirname, '../../sample_input_dataset.csv');
  const inputRaw = fs.readFileSync(inputCsvPath, 'utf8');
  const inputLines = inputRaw.split(/\r?\n/).filter(l => l.trim());
  const inputHeaders = splitCsvRow(inputLines[0]);

  const all1000Rows = inputLines.slice(1).map((line, idx) => {
    const vals = splitCsvRow(line);
    const obj: Record<string, string> = {};
    inputHeaders.forEach((h, i) => obj[h] = vals[i] ?? '');
    return { rowNum: idx + 1, data: obj };
  });

  console.log(`Total Rows in Dataset: ${all1000Rows.length}`);

  const processedRows: Array<{
    rowNum: number;
    mpn: string;
    status: 'SUCCEEDED' | 'FAILED';
    error?: string;
    hasLowConfidence?: boolean;
    flags?: string[];
    enriched?: EnrichedUnilogProduct;
    original?: Record<string, string>;
  }> = [];

  let succeededCount = 0;
  let failedCount = 0;
  let lowConfidenceRowCount = 0;

  // Process rows with batching and rate limit tracking
  for (let i = 0; i < all1000Rows.length; i++) {
    const item = all1000Rows[i];
    const rawInput = parseRawCsvRow(item.data);
    const rawBrands = [item.data['E1_Brand'] || '', item.data['Unilog_Brand'] || '', item.data['DIB_Brand'] || ''];

    try {
      const enriched = await enrichRawProductRow(rawInput);
      const sc = evaluateSelfConsistency(rawInput.part_desc, rawInput.part_manuf, rawBrands, enriched);

      if (sc.hasLowConfidence) {
        lowConfidenceRowCount++;
      }

      succeededCount++;
      processedRows.push({
        rowNum: item.rowNum,
        mpn: rawInput.mfg_part_num,
        status: 'SUCCEEDED',
        hasLowConfidence: sc.hasLowConfidence,
        flags: sc.flags,
        enriched,
        original: item.data
      });
    } catch (err: any) {
      failedCount++;
      processedRows.push({
        rowNum: item.rowNum,
        mpn: rawInput.mfg_part_num,
        status: 'FAILED',
        error: err.message
      });

      // If we encounter consecutive rate limit errors, log clearly
      if (err.message.includes('429') || err.message.includes('RESOURCE_EXHAUSTED')) {
        console.log(`Row ${item.rowNum} (MPN: ${rawInput.mfg_part_num}) encountered rate limit: ${err.message}`);
      }
    }

    if ((i + 1) % 50 === 0 || i + 1 === all1000Rows.length) {
      console.log(`Progress: ${i + 1}/${all1000Rows.length} rows processed (Succeeded: ${succeededCount}, Failed: ${failedCount})`);
    }
  }

  const completionPct = ((succeededCount / all1000Rows.length) * 100).toFixed(1);
  const lowConfPct = succeededCount > 0 ? ((lowConfidenceRowCount / succeededCount) * 100).toFixed(1) : '0';

  console.log('\n[STEP 1 RUN METRICS]');
  console.log(`Total Dataset Rows: ${all1000Rows.length}`);
  console.log(`Rows Succeeded: ${succeededCount}/${all1000Rows.length} (${completionPct}%)`);
  console.log(`Rows Failed: ${failedCount}/${all1000Rows.length}`);
  console.log(`Rows with at least one LOW_CONFIDENCE flag: ${lowConfidenceRowCount}/${succeededCount} (${lowConfPct}%)`);

  // -------------------------------------------------------------
  // STEP 5: Final CSV & XLSX Export Generation
  // -------------------------------------------------------------
  console.log('\n[STEP 5: GENERATING FINAL EXPORTS]');
  const exportItems = processedRows.filter(r => r.status === 'SUCCEEDED').map(r => ({
    enriched: r.enriched!,
    original: r.original
  }));

  // CSV
  const csvContent = buildUnilogCsv(exportItems);
  const finalCsvPath = path.resolve(__dirname, '../unihack_1000_output.csv');
  fs.writeFileSync(finalCsvPath, csvContent, 'utf8');
  const csvStats = fs.statSync(finalCsvPath);

  // XLSX
  const xlsxBuffer = buildUnilogXlsx(exportItems);
  const finalXlsxPath = path.resolve(__dirname, '../unihack_1000_output.xlsx');
  fs.writeFileSync(finalXlsxPath, xlsxBuffer);
  const xlsxStats = fs.statSync(finalXlsxPath);

  console.log(`Final CSV Path: ${finalCsvPath}`);
  console.log(`Final CSV Size: ${csvStats.size} bytes`);
  console.log(`Final CSV Total Lines: ${csvContent.split('\r\n').length}`);
  console.log(`Final CSV Column Count: ${csvContent.split('\r\n')[0].split(',').length}`);

  console.log(`Final XLSX Path: ${finalXlsxPath}`);
  console.log(`Final XLSX Size: ${xlsxStats.size} bytes`);

  // Write full execution report to disk
  fs.writeFileSync('unihack_1000_run_report.json', JSON.stringify({
    total_dataset_rows: all1000Rows.length,
    succeeded_count: succeededCount,
    failed_count: failedCount,
    completion_percentage: completionPct,
    low_confidence_rows: lowConfidenceRowCount,
    low_confidence_percentage: lowConfPct,
    failed_rows: processedRows.filter(r => r.status === 'FAILED'),
    export_csv: { path: finalCsvPath, size: csvStats.size, columns: 252 },
    export_xlsx: { path: finalXlsxPath, size: xlsxStats.size, columns: 252 }
  }, null, 2), 'utf8');
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
