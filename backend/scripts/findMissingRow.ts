import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const CACHE_FILE = path.resolve(__dirname, '../run1000_cache.ndjson');
const inputCsvPath = path.resolve(__dirname, '../../sample_input_dataset.csv');

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

const rawLines = fs.readFileSync(CACHE_FILE, 'utf8').split('\n').filter(l => l.trim());
const cachedMpns = new Set<string>();
for (const line of rawLines) {
  try {
    const p = JSON.parse(line);
    if (p.enriched?.mfg_part_num) cachedMpns.add(p.enriched.mfg_part_num.trim());
  } catch {}
}

const inputRaw = fs.readFileSync(inputCsvPath, 'utf8');
const inputLines = inputRaw.split(/\r?\n/).filter(l => l.trim());
const inputHeaders = splitCsvRow(inputLines[0]);

console.log(`Total input lines: ${inputLines.length} (1 header + ${inputLines.length - 1} data rows)`);
console.log(`Cached unique MPNs: ${cachedMpns.size}`);

const missing: Array<{ rowNum: number; mpn: string; desc: string }> = [];
const duplicateMpns: Record<string, number[]> = {};

for (let i = 1; i < inputLines.length; i++) {
  const vals = splitCsvRow(inputLines[i]);
  const obj: Record<string, string> = {};
  inputHeaders.forEach((h, idx) => obj[h] = vals[idx] ?? '');
  const mpn = (obj['Mfg_Part_Num'] || '').trim();

  if (!duplicateMpns[mpn]) duplicateMpns[mpn] = [];
  duplicateMpns[mpn].push(i);

  if (!cachedMpns.has(mpn)) {
    missing.push({ rowNum: i, mpn, desc: obj['Part_Desc'] });
  }
}

console.log('Missing rows from cache:', missing);
const duplicates = Object.entries(duplicateMpns).filter(([_, rows]) => rows.length > 1);
console.log('Duplicate MPNs in dataset:', duplicates);
