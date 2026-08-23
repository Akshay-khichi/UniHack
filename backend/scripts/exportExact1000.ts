import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { EnrichedUnilogProduct } from '../src/services/enrichment/unilogEnrichmentService';
import { buildUnilogCsv, buildUnilogXlsx, UNILOG_CSV_HEADERS } from '../src/services/enrichment/unilogCsvExport';

const CACHE_FILE = path.resolve(__dirname, '../run1000_cache.ndjson');
const INPUT_CSV = path.resolve(__dirname, '../../sample_input_dataset.csv');
const CSV_OUT = path.resolve(__dirname, '../run1000_output.csv');
const XLSX_OUT = path.resolve(__dirname, '../run1000_output.xlsx');
const DELIVERY_CSV = path.resolve(__dirname, '../output_delivery_format.csv');
const DELIVERY_XLSX = path.resolve(__dirname, '../output_delivery_format.xlsx');

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

function exportFull1000Dataset() {
  console.log('=== FINAL 1,000-ROW DATASET EXPORT ===\n');

  // 1. Load cache into MPN map
  const cacheRaw = fs.readFileSync(CACHE_FILE, 'utf8').split('\n').filter(l => l.trim());
  const enrichedByMpn = new Map<string, EnrichedUnilogProduct>();

  for (const line of cacheRaw) {
    try {
      const p = JSON.parse(line);
      if (p.enriched?.mfg_part_num) {
        enrichedByMpn.set(p.enriched.mfg_part_num.trim(), p.enriched);
      }
    } catch {}
  }

  console.log(`Unique enriched products in cache: ${enrichedByMpn.size}`);

  // 2. Load all 1000 input rows
  const inputRaw = fs.readFileSync(INPUT_CSV, 'utf8');
  const inputLines = inputRaw.split(/\r?\n/).filter(l => l.trim());
  const inputHeaders = splitCsvRow(inputLines[0]);
  const dataLines = inputLines.slice(1);

  console.log(`Input catalog rows: ${dataLines.length}`);

  const exportItems: Array<{ enriched: EnrichedUnilogProduct; original: Record<string, string> }> = [];

  for (let idx = 0; idx < dataLines.length; idx++) {
    const vals = splitCsvRow(dataLines[idx]);
    const obj: Record<string, string> = {};
    inputHeaders.forEach((h, i) => obj[h] = vals[i] ?? '');

    const mpn = (obj['Mfg_Part_Num'] || '').trim();
    const enriched = enrichedByMpn.get(mpn);

    if (!enriched) {
      throw new Error(`CRITICAL: Row ${idx + 1} (MPN: ${mpn}) not found in enrichment cache!`);
    }

    exportItems.push({
      enriched,
      original: obj
    });
  }

  console.log(`Successfully mapped all ${exportItems.length}/1000 rows to enriched records.`);

  // 3. Build CSV
  const csvContent = buildUnilogCsv(exportItems);
  fs.writeFileSync(CSV_OUT, csvContent, 'utf8');
  fs.writeFileSync(DELIVERY_CSV, csvContent, 'utf8');
  const csvStats = fs.statSync(CSV_OUT);
  const csvLines = csvContent.split('\r\n');
  const csvDataRowCount = csvLines.length - 1;

  // 4. Build XLSX
  const xlsxBuffer = buildUnilogXlsx(exportItems);
  fs.writeFileSync(XLSX_OUT, xlsxBuffer);
  fs.writeFileSync(DELIVERY_XLSX, xlsxBuffer);
  const xlsxStats = fs.statSync(XLSX_OUT);

  console.log('\n[FINAL VERIFIED EXPORT DETAILS]');
  console.log(`CSV Export File: ${CSV_OUT}`);
  console.log(`CSV File Size: ${csvStats.size} bytes`);
  console.log(`CSV Total Lines: ${csvLines.length} (1 header + ${csvDataRowCount} data rows)`);
  console.log(`CSV Column Count: ${UNILOG_CSV_HEADERS.length}`);

  console.log(`\nXLSX Export File: ${XLSX_OUT}`);
  console.log(`XLSX File Size: ${xlsxStats.size} bytes`);
  console.log(`XLSX Data Rows: ${exportItems.length}`);
  console.log(`XLSX Column Count: ${UNILOG_CSV_HEADERS.length}`);

  if (exportItems.length === 1000 && csvDataRowCount === 1000) {
    console.log(`\n[VERIFIED] rows completed (1000) === rows in export (1000) -- PASS`);
  } else {
    console.log(`\n*** MISMATCH: items=${exportItems.length}, csvDataRows=${csvDataRowCount} ***`);
  }
}

exportFull1000Dataset();
