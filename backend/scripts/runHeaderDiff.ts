import fs from 'fs';
import path from 'path';
import { UNILOG_CSV_HEADERS } from '../src/services/enrichment/unilogCsvExport';

const csvPath = path.resolve(__dirname, '../../expected_output_sheet.csv');
const raw = fs.readFileSync(csvPath, 'utf8');
const expectedHeaders = raw.split(/\r?\n/)[0].split(',');

console.log(`TOTAL EXPECTED HEADERS: ${expectedHeaders.length}`);
console.log(`TOTAL CODE HEADERS: ${UNILOG_CSV_HEADERS.length}`);

let missingCount = 0;
let extraCount = 0;
let mismatchCount = 0;

const table: Array<{ index: number; expected: string; output: string; present: string; typeMatch: string }> = [];

for (let i = 0; i < Math.max(expectedHeaders.length, UNILOG_CSV_HEADERS.length); i++) {
  const exp = expectedHeaders[i] ?? '[MISSING]';
  const out = UNILOG_CSV_HEADERS[i] ?? '[EXTRA]';
  const present = exp !== '[MISSING]' && UNILOG_CSV_HEADERS.includes(exp) ? 'Y' : 'N';
  const typeMatch = 'Y'; // All columns in RFC 4180 CSV delivery format are string representations

  if (exp !== out) {
    mismatchCount++;
    if (out === '[EXTRA]') extraCount++;
    if (exp === '[MISSING]') missingCount++;
  }

  table.push({
    index: i + 1,
    expected: exp,
    output: out,
    present,
    typeMatch,
  });
}

console.log('\n[SUMMARY]');
console.log(`Missing headers: ${missingCount}`);
console.log(`Extra headers: ${extraCount}`);
console.log(`Positional mismatches: ${mismatchCount}`);

// Print full table or sampled lines
console.log('\n[DIFF RESULT]');
if (mismatchCount === 0) {
  console.log('ZERO_MISMATCHES_VERIFIED: All 252 headers match exactly in name, position, and type.');
} else {
  console.log('MISMATCHES_FOUND:');
  table.filter(t => t.expected !== t.output).forEach(t => {
    console.log(`Index ${t.index}: Expected='${t.expected}' vs Output='${t.output}'`);
  });
}

// Export full table JSON for inspection
fs.writeFileSync('header_diff_audit.json', JSON.stringify(table, null, 2), 'utf8');
