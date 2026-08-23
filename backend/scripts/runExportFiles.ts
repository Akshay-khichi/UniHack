import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { parseRawCsvRow, enrichRawProductRow } from '../src/services/enrichment/unilogEnrichmentService';
import { buildUnilogCsv, buildUnilogXlsx } from '../src/services/enrichment/unilogCsvExport';

async function runExportTest() {
  const csvPath = path.resolve(__dirname, '../../expected_output_sheet.csv');
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

  console.log(`Enriching ${rows.length} rows for physical export generation...`);
  const enrichedList: Array<{ enriched: any; original: any }> = [];

  for (const row of rows) {
    const rawInput = parseRawCsvRow({
      Mfg_Part_Num: row['Mfg_Part_Num'] || row['MANUFACTURER_PART_NUMBER'],
      Part_Desc: row['Part_Desc'] || row['SHORT_DESC'],
      Part_Manuf: row['Part_Manuf'] || row['MANUFACTURER_NAME'],
      E1_Brand: row['E1_Brand'],
      Unilog_Brand: row['Unilog_Brand'],
      DIB_Brand: row['DIB_Brand'],
    });

    const enriched = await enrichRawProductRow(rawInput);
    enrichedList.push({ enriched, original: row });
  }

  // 1. Generate CSV export
  const csvContent = buildUnilogCsv(enrichedList);
  const csvFilePath = path.resolve(__dirname, '../output_delivery_format.csv');
  fs.writeFileSync(csvFilePath, csvContent, 'utf8');
  const csvStats = fs.statSync(csvFilePath);

  // 2. Generate XLSX export
  const xlsxBuffer = buildUnilogXlsx(enrichedList);
  const xlsxFilePath = path.resolve(__dirname, '../output_delivery_format.xlsx');
  fs.writeFileSync(xlsxFilePath, xlsxBuffer);
  const xlsxStats = fs.statSync(xlsxFilePath);

  console.log('\n[EXPORT GENERATION RESULTS]');
  console.log(`CSV Export File: ${csvFilePath}`);
  console.log(`CSV Export Size: ${csvStats.size} bytes`);
  console.log(`CSV Total Lines: ${csvContent.split('\r\n').length}`);
  console.log(`CSV Header Columns: ${csvContent.split('\r\n')[0].split(',').length}`);

  console.log(`\nXLSX Export File: ${xlsxFilePath}`);
  console.log(`XLSX Export Size: ${xlsxStats.size} bytes`);
}

runExportTest().catch(err => {
  console.error('Export test failed:', err);
  process.exit(1);
});
