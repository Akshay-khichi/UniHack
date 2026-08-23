import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { EnrichedUnilogProduct } from '../src/services/enrichment/unilogEnrichmentService';
import { buildUnilogCsv, buildUnilogXlsx, UNILOG_CSV_HEADERS } from '../src/services/enrichment/unilogCsvExport';

const CACHE_FILE = path.resolve(__dirname, '../run1000_cache.ndjson');
const CSV_OUT = path.resolve(__dirname, '../run1000_output.csv');
const XLSX_OUT = path.resolve(__dirname, '../run1000_output.xlsx');

function exportFromCache() {
  console.log('[EXPORT CACHE RUN]');
  if (!fs.existsSync(CACHE_FILE)) {
    throw new Error('Cache file does not exist: ' + CACHE_FILE);
  }

  const rawLines = fs.readFileSync(CACHE_FILE, 'utf8').split('\n').filter(l => l.trim());
  console.log(`Read ${rawLines.length} lines from ${CACHE_FILE}`);

  const items: Array<{ enriched: EnrichedUnilogProduct; original: Record<string, string> }> = [];
  const seenMpns = new Set<string>();

  for (let i = 0; i < rawLines.length; i++) {
    try {
      const parsed = JSON.parse(rawLines[i]);
      if (parsed.enriched) {
        items.push({
          enriched: parsed.enriched,
          original: parsed.original || {}
        });
        if (parsed.enriched.mfg_part_num) {
          seenMpns.add(parsed.enriched.mfg_part_num);
        }
      }
    } catch (err: any) {
      console.warn(`Line ${i + 1} parse error:`, err.message);
    }
  }

  console.log(`Parsed ${items.length} items from cache (${seenMpns.size} unique MPNs)`);

  // Build CSV
  const csvContent = buildUnilogCsv(items);
  fs.writeFileSync(CSV_OUT, csvContent, 'utf8');
  const csvStats = fs.statSync(CSV_OUT);
  const csvLines = csvContent.split('\r\n');
  const csvHeaderCols = csvLines[0].split(',').length;
  const csvDataRowCount = csvLines.length - 1; // excluding header

  // Build XLSX
  const xlsxBuffer = buildUnilogXlsx(items);
  fs.writeFileSync(XLSX_OUT, xlsxBuffer);
  const xlsxStats = fs.statSync(XLSX_OUT);

  console.log('\n[EXPORT DETAILS]');
  console.log(`CSV Path: ${CSV_OUT}`);
  console.log(`CSV File Size: ${csvStats.size} bytes`);
  console.log(`CSV Total Lines: ${csvLines.length} (1 header + ${csvDataRowCount} data rows)`);
  console.log(`CSV Column Count: ${csvHeaderCols}`);

  console.log(`\nXLSX Path: ${XLSX_OUT}`);
  console.log(`XLSX File Size: ${xlsxStats.size} bytes`);
  console.log(`XLSX Data Rows: ${items.length}`);
  console.log(`XLSX Column Count: ${UNILOG_CSV_HEADERS.length}`);

  if (items.length === csvDataRowCount && items.length === 387) {
    console.log(`\n[VERIFIED] rows completed (${items.length}) === rows in export (${csvDataRowCount}) -- PASS`);
  } else {
    console.log(`\n*** MISMATCH: items=${items.length}, csvDataRows=${csvDataRowCount} ***`);
  }
}

exportFromCache();
