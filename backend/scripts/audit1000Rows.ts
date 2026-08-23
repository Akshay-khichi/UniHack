import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { parseRawCsvRow, enrichRawProductRow } from '../src/services/enrichment/unilogEnrichmentService';
import { normalizeUom, cleanPlaceholder, parseManufacturerField } from '../src/services/enrichment/unilogNormalization';

async function audit1000Rows() {
  const csvPath = path.resolve(__dirname, '../../sample_input_dataset.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('File sample_input_dataset.csv not found');
    return;
  }

  const raw = fs.readFileSync(csvPath, 'utf8');
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  const headers = lines[0].split(',');

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

  const rows = lines.slice(1).map((line, idx) => {
    const vals = splitCsvRow(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h] = vals[i] ?? ''));
    return { rowNumber: idx + 1, data: obj };
  });

  console.log(`Loaded ${rows.length} rows from sample_input_dataset.csv`);

  // Stage 1 Audit: Input Analysis & Normalization Parsing across all 1000 rows
  let validParse = 0;
  let hasMpn = 0;
  let hasDesc = 0;
  let placeholdersCleaned = 0;
  let parsedManuf = 0;

  const parseErrors: Array<{ row: number; mpn: string; error: string }> = [];

  for (const r of rows) {
    try {
      const rawRow = parseRawCsvRow(r.data);
      if (rawRow.mfg_part_num && rawRow.mfg_part_num !== 'UNKNOWN') hasMpn++;
      if (rawRow.part_desc) hasDesc++;

      const brand = r.data['E1_Brand'] || r.data['Unilog_Brand'] || r.data['DIB_Brand'] || '';
      if (brand.includes('--') || brand.toLowerCase().includes('unbranded')) {
        const cleaned = cleanPlaceholder(brand);
        if (cleaned === '') placeholdersCleaned++;
      }

      if (r.data['Part_Manuf']) {
        const parsed = parseManufacturerField(r.data['Part_Manuf']);
        if (parsed.name) parsedManuf++;
      }

      validParse++;
    } catch (err: any) {
      parseErrors.push({ row: r.rowNumber, mpn: r.data['Mfg_Part_Num'] || 'UNKNOWN', error: err.message });
    }
  }

  console.log('\n[STAGE 1: INPUT ANALYSIS ACROSS 1000 ROWS]');
  console.log(`Total Rows Ingested: ${rows.length}`);
  console.log(`Valid Parsed Rows: ${validParse}/${rows.length} (${((validParse / rows.length) * 100).toFixed(1)}%)`);
  console.log(`Rows with MPN: ${hasMpn}/${rows.length}`);
  console.log(`Rows with Description: ${hasDesc}/${rows.length}`);
  console.log(`Rows with Sanitized Placeholders: ${placeholdersCleaned}`);
  console.log(`Rows with Parsed Manufacturer Names: ${parsedManuf}/${rows.length}`);
  console.log(`Parse Errors: ${parseErrors.length}`);

  // Stage 2: Live AI Enrichment Sample (50 rows across dataset to test real AI behavior)
  const sampleRows = rows.slice(0, 50);
  console.log(`\n[STAGE 2: LIVE AI ENRICHMENT ON SAMPLE OF ${sampleRows.length} ROWS]`);
  
  let successCount = 0;
  let failedCount = 0;
  const failedRows: Array<{ row: number; mpn: string; error: string }> = [];

  for (const r of sampleRows) {
    const rawInput = parseRawCsvRow(r.data);
    try {
      const enriched = await enrichRawProductRow(rawInput);
      successCount++;
    } catch (err: any) {
      failedCount++;
      failedRows.push({ row: r.rowNumber, mpn: rawInput.mfg_part_num, error: err.message });
    }
  }

  console.log(`Successful Live AI Rows: ${successCount}/${sampleRows.length}`);
  console.log(`Failed AI Rows: ${failedCount}/${sampleRows.length}`);
  if (failedRows.length > 0) {
    console.log('Failed Row Details:');
    failedRows.forEach(f => console.log(`Row ${f.row} (MPN ${f.mpn}): ${f.error}`));
  }

  // Write audit details to disk
  fs.writeFileSync('audit_1000_rows_report.json', JSON.stringify({
    total_rows: rows.length,
    valid_parse_count: validParse,
    parse_errors: parseErrors,
    sample_tested: sampleRows.length,
    sample_success: successCount,
    sample_failed: failedCount,
    sample_failed_details: failedRows
  }, null, 2), 'utf8');
}

audit1000Rows().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
