import 'dotenv/config';
import { parseRawCsvRow, enrichRawProductRow } from '../src/services/enrichment/unilogEnrichmentService';

const ROW18 = {
  Mfg_Part_Num: '49-94-0029',
  Part_Desc: '49-94-0029 Cut-Off Wheel, 4-1/2 in dia, 3/64 in Thick, 7/8 in Arbor',
  Part_Manuf: 'Milwaukee Electric Tool Corporation (MILWA)',
  E1_Brand: '',
  Unilog_Brand: '',
  DIB_Brand: '',
};

async function main() {
  console.log(`[ROW18 ISOLATED RETRY] ${new Date().toISOString()} | MPN: 49-94-0029`);
  const rawInput = parseRawCsvRow(ROW18);
  try {
    const enriched = await enrichRawProductRow(rawInput);
    console.log(`[ROW18 SUCCESS] manufacturer_name: "${enriched.manufacturer_name}" | brand_name: "${enriched.brand_name}" | classpath: "${enriched.classpath}"`);
    console.log(`[ROW18 SUCCESS] invoice_desc: "${enriched.invoice_desc}"`);
    console.log(`[ROW18 SUCCESS] attributes count: ${enriched.attributes.length}`);
  } catch (err: any) {
    console.log(`[ROW18 FINAL FAIL] ${new Date().toISOString()} | Error: ${(err as Error).message?.slice(0, 200)}`);
    console.log('[ROW18 FINAL FAIL] Excluding from final run — logged as known failed row.');
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
