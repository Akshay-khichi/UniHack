import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { parseRawCsvRow, enrichRawProductRow } from '../src/services/enrichment/unilogEnrichmentService';
import { mapToUnilogRow, UNILOG_CSV_HEADERS } from '../src/services/enrichment/unilogCsvExport';

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

async function testDishwasher() {
  const expectedCsvPath = path.resolve(__dirname, '../../expected_output_sheet.csv');
  const expectedRaw = fs.readFileSync(expectedCsvPath, 'utf8');
  const lines = expectedRaw.split(/\r?\n/).filter(l => l.trim());
  const expectedHeaders = splitCsvRow(lines[0]);
  const gtVals = splitCsvRow(lines[1]);
  const gtRowObj: Record<string, string> = {};
  expectedHeaders.forEach((h, i) => gtRowObj[h] = gtVals[i] ?? '');

  const gtRawInput = parseRawCsvRow({
    Mfg_Part_Num: gtRowObj['Mfg_Part_Num'] || gtRowObj['MANUFACTURER_PART_NUMBER'],
    Part_Desc: gtRowObj['Part_Desc'] || gtRowObj['SHORT_DESC'],
    Part_Manuf: gtRowObj['Part_Manuf'] || gtRowObj['MANUFACTURER_NAME'],
    E1_Brand: gtRowObj['E1_Brand'],
    Unilog_Brand: gtRowObj['Unilog_Brand'],
    DIB_Brand: gtRowObj['DIB_Brand'],
  });

  console.log('Enriching PDSH4816AF with updated brand/manufacturer extraction logic...');
  const enriched = await enrichRawProductRow(gtRawInput);
  const generatedRow = mapToUnilogRow(enriched, gtRowObj);

  console.log('\n[RAW DISHWASHER FIELD-BY-FIELD COMPARISON]');
  const comparison: Array<{ field: string; expected: string; generated: string; status: string }> = [];

  expectedHeaders.forEach((h) => {
    const expVal = (gtRowObj[h] ?? '').trim();
    const genVal = (generatedRow[h] ?? '').trim();

    if (expVal !== '' || genVal !== '') {
      let status = 'MISMATCH';
      if (expVal === '' && genVal === '') {
        status = 'EMPTY';
      } else if (expVal.toLowerCase() === genVal.toLowerCase()) {
        status = 'MATCH';
      }
      comparison.push({ field: h, expected: expVal, generated: genVal, status });
      console.log(`FIELD: ${h} | EXPECTED: "${expVal}" | GENERATED: "${genVal}" | STATUS: ${status}`);
    }
  });

  fs.writeFileSync('dishwasher_comparison_fixed.json', JSON.stringify(comparison, null, 2), 'utf8');
}

testDishwasher().catch(err => {
  console.error('Dishwasher test error:', err);
  process.exit(1);
});
