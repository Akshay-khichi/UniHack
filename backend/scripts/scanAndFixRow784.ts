import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { parseRawCsvRow, enrichRawProductRow, EnrichedUnilogProduct } from '../src/services/enrichment/unilogEnrichmentService';
import { buildUnilogCsv, buildUnilogXlsx, mapToUnilogRow, UNILOG_CSV_HEADERS } from '../src/services/enrichment/unilogCsvExport';

const INPUT_CSV = path.resolve(__dirname, '../../sample_input_dataset.csv');
const CACHE_FILE = path.resolve(__dirname, '../run1000_cache.ndjson');
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

async function main() {
  console.log('=== STEP 4: SCANNING DATASET FOR DUPLICATE MPNS ===');
  const inputRaw = fs.readFileSync(INPUT_CSV, 'utf8');
  const inputLines = inputRaw.split(/\r?\n/).filter(l => l.trim());
  const inputHeaders = splitCsvRow(inputLines[0]);

  const mpnMap = new Map<string, Array<{ rowNum: number; desc: string; raw: Record<string, string> }>>();

  for (let i = 1; i < inputLines.length; i++) {
    const vals = splitCsvRow(inputLines[i]);
    const obj: Record<string, string> = {};
    inputHeaders.forEach((h, idx) => obj[h] = vals[idx] ?? '');
    const mpn = (obj['Mfg_Part_Num'] || '').trim();

    if (!mpnMap.has(mpn)) {
      mpnMap.set(mpn, []);
    }
    mpnMap.get(mpn)!.push({ rowNum: i, desc: obj['Part_Desc'] || '', raw: obj });
  }

  const allDuplicates: Array<{ mpn: string; count: number; rows: Array<{ rowNum: number; desc: string }> }> = [];
  const differingDuplicates: Array<{ mpn: string; count: number; rows: Array<{ rowNum: number; desc: string }> }> = [];

  mpnMap.forEach((rows, mpn) => {
    if (rows.length > 1) {
      allDuplicates.push({ mpn, count: rows.length, rows: rows.map(r => ({ rowNum: r.rowNum, desc: r.desc })) });
      const firstDesc = rows[0].desc.trim().toLowerCase();
      const hasDifferentDesc = rows.some(r => r.desc.trim().toLowerCase() !== firstDesc);
      if (hasDifferentDesc) {
        differingDuplicates.push({ mpn, count: rows.length, rows: rows.map(r => ({ rowNum: r.rowNum, desc: r.desc })) });
      }
    }
  });

  console.log(`Total Unique MPNs: ${mpnMap.size} across ${inputLines.length - 1} input rows`);
  console.log(`Total MPNs appearing more than once: ${allDuplicates.length}`);
  console.log(`MPNs with differing Part_Desc across duplicate rows: ${differingDuplicates.length}`);
  if (differingDuplicates.length > 0) {
    console.log('Differing duplicate details:', JSON.stringify(differingDuplicates, null, 2));
  }

  console.log('\n=== STEP 1: INDEPENDENTLY ENRICHING ROW 784 (AVM7 EV Mini Snip Green) ===');
  const row784Raw = inputLines[784];
  const row784Vals = splitCsvRow(row784Raw);
  const row784Obj: Record<string, string> = {};
  inputHeaders.forEach((h, idx) => row784Obj[h] = row784Vals[idx] ?? '');

  console.log('Row 784 Input:', JSON.stringify(row784Obj, null, 2));

  const row784Input = parseRawCsvRow(row784Obj);
  const row784Enriched = await enrichRawProductRow(row784Input);

  console.log('\nRow 784 Enriched Result:');
  console.log(`- Product Name: ${row784Enriched.product_name}`);
  console.log(`- Classpath: ${row784Enriched.classpath}`);
  console.log(`- Invoice Desc: ${row784Enriched.invoice_desc}`);
  console.log(`- Mobile Desc: ${row784Enriched.mobile_desc}`);
  console.log(`- Short Desc: ${row784Enriched.short_desc}`);
  console.log(`- Attributes:`, JSON.stringify(row784Enriched.attributes, null, 2));

  console.log('\n=== STEP 2: UPDATING CACHE AND EXPORTS (1000 ROWS) ===');
  // Load existing cache into an array of 1000 rows indexed by row index
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

  const all1000ExportItems: Array<{ enriched: EnrichedUnilogProduct; original: Record<string, string> }> = [];

  for (let i = 1; i < inputLines.length; i++) {
    const vals = splitCsvRow(inputLines[i]);
    const obj: Record<string, string> = {};
    inputHeaders.forEach((h, idx) => obj[h] = vals[idx] ?? '');
    const mpn = (obj['Mfg_Part_Num'] || '').trim();

    if (i === 784) {
      // Row 784: use the newly independently enriched object
      all1000ExportItems.push({
        enriched: row784Enriched,
        original: obj
      });
    } else {
      const enriched = enrichedByMpn.get(mpn);
      if (!enriched) {
        throw new Error(`Row ${i} (MPN: ${mpn}) missing from cache!`);
      }
      all1000ExportItems.push({
        enriched,
        original: obj
      });
    }
  }

  // Rewrite cache with all 1000 records
  const newCacheLines = all1000ExportItems.map(item => JSON.stringify({
    enriched: item.enriched,
    original: item.original,
    outputRow: mapToUnilogRow(item.enriched, item.original)
  }));
  fs.writeFileSync(CACHE_FILE, newCacheLines.join('\n') + '\n', 'utf8');
  console.log(`Rewrote cache ${CACHE_FILE} with ${all1000ExportItems.length} lines.`);

  // Export CSV
  const csvContent = buildUnilogCsv(all1000ExportItems);
  fs.writeFileSync(CSV_OUT, csvContent, 'utf8');
  fs.writeFileSync(DELIVERY_CSV, csvContent, 'utf8');
  const csvStats = fs.statSync(CSV_OUT);
  const csvLines = csvContent.split('\r\n');
  const csvDataRowCount = csvLines.length - 1;

  // Export XLSX
  const xlsxBuffer = buildUnilogXlsx(all1000ExportItems);
  fs.writeFileSync(XLSX_OUT, xlsxBuffer);
  fs.writeFileSync(DELIVERY_XLSX, xlsxBuffer);
  const xlsxStats = fs.statSync(XLSX_OUT);

  console.log('\n[FINAL VERIFIED EXPORT DETAILS]');
  console.log(`CSV Export File: ${CSV_OUT}`);
  console.log(`CSV File Size: ${csvStats.size} bytes`);
  console.log(`CSV Data Rows: ${csvDataRowCount}`);
  console.log(`CSV Column Count: ${UNILOG_CSV_HEADERS.length}`);

  console.log(`XLSX Export File: ${XLSX_OUT}`);
  console.log(`XLSX File Size: ${xlsxStats.size} bytes`);
  console.log(`XLSX Data Rows: ${all1000ExportItems.length}`);
  console.log(`XLSX Column Count: ${UNILOG_CSV_HEADERS.length}`);

  if (all1000ExportItems.length === 1000 && csvDataRowCount === 1000) {
    console.log(`\n[VERIFIED] rows completed (1000) === rows in export (1000) -- PASS`);
  } else {
    console.log(`\n*** MISMATCH: items=${all1000ExportItems.length}, csvDataRows=${csvDataRowCount} ***`);
  }

  console.log('\n=== STEP 3: SIDE-BY-SIDE COMPARISON ROW 783 VS ROW 784 ===');
  const row783Out = mapToUnilogRow(all1000ExportItems[782].enriched, all1000ExportItems[782].original);
  const row784Out = mapToUnilogRow(all1000ExportItems[783].enriched, all1000ExportItems[783].original);

  const diffTable: Array<{ field: string; row783_red: string; row784_green: string; differs: string }> = [];

  UNILOG_CSV_HEADERS.forEach(h => {
    const v783 = row783Out[h] || '';
    const v784 = row784Out[h] || '';
    if (v783 || v784) {
      diffTable.push({
        field: h,
        row783_red: v783,
        row784_green: v784,
        differs: v783 !== v784 ? 'YES' : 'NO'
      });
    }
  });

  fs.writeFileSync('row783_vs_row784_diff.json', JSON.stringify(diffTable, null, 2), 'utf8');
  console.log(`Saved row comparison to row783_vs_row784_diff.json (${diffTable.length} populated fields compared).`);
}

main().catch(err => {
  console.error('Fatal error in scanAndFixRow784:', err);
  process.exit(1);
});
