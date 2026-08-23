import 'dotenv/config';
import fs from 'fs';
import path from 'path';

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

const inputCsv = path.resolve(__dirname, '../../sample_input_dataset.csv');
const outputCsv = path.resolve(__dirname, '../run1000_output.csv');

// 1. Check Input Rows for AVM6EV
const inLines = fs.readFileSync(inputCsv, 'utf8').split(/\r?\n/).filter(l => l.trim());
const inHeaders = splitCsvRow(inLines[0]);
const inRows: Array<{ lineIndex: number; data: Record<string, string> }> = [];

for (let i = 1; i < inLines.length; i++) {
  const vals = splitCsvRow(inLines[i]);
  const obj: Record<string, string> = {};
  inHeaders.forEach((h, idx) => obj[h] = vals[idx] ?? '');
  if ((obj['Mfg_Part_Num'] || '').trim() === 'AVM6EV') {
    inRows.push({ lineIndex: i, data: obj });
  }
}

// 2. Check Output Rows for AVM6EV
const outLines = fs.readFileSync(outputCsv, 'utf8').split(/\r?\n/).filter(l => l.trim());
const outHeaders = splitCsvRow(outLines[0]);
const outRows: Array<{ lineIndex: number; data: Record<string, string> }> = [];

for (let i = 1; i < outLines.length; i++) {
  const vals = splitCsvRow(outLines[i]);
  const obj: Record<string, string> = {};
  outHeaders.forEach((h, idx) => obj[h] = vals[idx] ?? '');
  if ((obj['Mfg_Part_Num'] || '').trim() === 'AVM6EV') {
    outRows.push({ lineIndex: i, data: obj });
  }
}

console.log('=== INPUT ROWS FOR AVM6EV ===');
console.log(JSON.stringify(inRows, null, 2));

console.log('\n=== OUTPUT ROWS FOR AVM6EV ===');
// Filter out to key populated fields
const comparison: Array<{ field: string; row1: string; row2: string; match: boolean }> = [];
outHeaders.forEach(h => {
  const val1 = outRows[0]?.data[h] ?? '';
  const val2 = outRows[1]?.data[h] ?? '';
  if (val1 || val2) {
    comparison.push({
      field: h,
      row1: val1,
      row2: val2,
      match: val1 === val2
    });
  }
});

console.log(JSON.stringify({
  row1_index: outRows[0]?.lineIndex,
  row2_index: outRows[1]?.lineIndex,
  populated_fields_comparison: comparison
}, null, 2));
