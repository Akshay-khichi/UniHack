import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { parseRawCsvRow, enrichRawProductRow } from '../src/services/enrichment/unilogEnrichmentService';
import { mapToUnilogRow, UNILOG_CSV_HEADERS } from '../src/services/enrichment/unilogCsvExport';

async function runGroundTruthEval() {
  const csvPath = path.resolve(__dirname, '../../expected_output_sheet.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('File expected_output_sheet.csv not found');
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

  const rows = lines.slice(1).map((line) => {
    const vals = splitCsvRow(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h] = vals[i] ?? ''));
    return obj;
  });

  console.log(`Loaded ${rows.length} ground truth rows from expected_output_sheet.csv`);

  const results: any[] = [];
  const fieldsToCheck = [
    'MANUFACTURER_NAME',
    'BRAND_NAME',
    'MANUFACTURER_PART_NUMBER',
    'Classpath',
    'INVOICE_DESC',
    'MOBILE_DESC',
    'SHORT_DESC',
    'LONG_DESC1',
    'MARKETING_DESCRIPTION',
    'Product Name'
  ];

  const fieldMatches: Record<string, number> = {};
  fieldsToCheck.forEach(f => fieldMatches[f] = 0);

  let invoiceDescCharCompliant = 0;
  let mobileDescCharCompliant = 0;

  for (let i = 0; i < rows.length; i++) {
    const gtRow = rows[i];
    const rawInput = parseRawCsvRow({
      Mfg_Part_Num: gtRow['Mfg_Part_Num'] || gtRow['MANUFACTURER_PART_NUMBER'],
      Part_Desc: gtRow['Part_Desc'] || gtRow['SHORT_DESC'],
      Part_Manuf: gtRow['Part_Manuf'] || gtRow['MANUFACTURER_NAME'],
      E1_Brand: gtRow['E1_Brand'],
      Unilog_Brand: gtRow['Unilog_Brand'],
      DIB_Brand: gtRow['DIB_Brand'],
    });

    try {
      console.log(`Enriching row ${i + 1}: ${rawInput.mfg_part_num}...`);
      const enriched = await enrichRawProductRow(rawInput);
      const generatedRow = mapToUnilogRow(enriched, gtRow);

      // Check character limits
      if (generatedRow['INVOICE_DESC'].length > 0 && generatedRow['INVOICE_DESC'].length <= 40) {
        invoiceDescCharCompliant++;
      }
      if (generatedRow['MOBILE_DESC'].length >= 60 && generatedRow['MOBILE_DESC'].length <= 80) {
        mobileDescCharCompliant++;
      } else if (generatedRow['MOBILE_DESC'].length > 0 && generatedRow['MOBILE_DESC'].length <= 80) {
        mobileDescCharCompliant += 0.5; // partial length
      }

      fieldsToCheck.forEach(field => {
        const genVal = (generatedRow[field] || '').trim().toLowerCase();
        const gtVal = (gtRow[field] || '').trim().toLowerCase();
        if (genVal === gtVal && gtVal.length > 0) {
          fieldMatches[field]++;
        }
      });

      results.push({
        mpn: rawInput.mfg_part_num,
        status: 'COMPLETE',
        generated: generatedRow,
        gt: gtRow
      });
    } catch (err: any) {
      results.push({
        mpn: rawInput.mfg_part_num,
        status: 'FAILED',
        error: err.message
      });
    }
  }

  // Save full run output to debug file
  fs.writeFileSync('ground_truth_eval_run.json', JSON.stringify(results, null, 2), 'utf8');

  console.log('\n[FIELD-LEVEL ACCURACY TABLE]');
  fieldsToCheck.forEach(f => {
    const matches = fieldMatches[f];
    const total = rows.length;
    const pct = ((matches / total) * 100).toFixed(1);
    console.log(`FIELD: ${f} | MATCHES: ${matches} | TOTAL: ${total} | ACCURACY: ${pct}%`);
  });

  console.log('\n[CHARACTER LIMIT COMPLIANCE]');
  console.log(`INVOICE_DESC <= 40 chars: ${invoiceDescCharCompliant}/${rows.length} (${((invoiceDescCharCompliant / rows.length) * 100).toFixed(1)}%)`);
  console.log(`MOBILE_DESC 60-80 chars: ${mobileDescCharCompliant}/${rows.length} (${((mobileDescCharCompliant / rows.length) * 100).toFixed(1)}%)`);

  console.log('\n[ROW STATUS]');
  const complete = results.filter(r => r.status === 'COMPLETE').length;
  const failed = results.filter(r => r.status === 'FAILED');
  console.log(`COMPLETE: ${complete}/${rows.length}`);
  console.log(`FAILED: ${failed.length}/${rows.length}`);
  failed.forEach(f => console.log(`FAILED ROW MPN: ${f.mpn} | ERROR: ${f.error}`));
}

runGroundTruthEval().catch(err => {
  console.error('Fatal eval error:', err);
});
