import * as XLSX from 'xlsx';
import { EnrichedUnilogProduct, UnilogAttribute } from './unilogEnrichmentService';

// The 252 static header columns from the official expected_output_sheet.csv
export const UNILOG_CSV_HEADERS = [
  'MFR URL', 'Ref URL 1', 'Ref URL 2', 'Ref URL 3', 'Ref URL 4', 'Ref URL 5',
  'PART_NUMBER', 'Dept', 'Class', 'Fine', 'SKU - MY_PART_NUMBER',
  'Mfg_Part_Num', 'Part_Desc', 'E1_Brand', 'Unilog_Brand', 'DIB_Brand', 'Part_Manuf',
  'MANUFACTURER_NAME', 'BRAND_NAME', 'TRADE_NAME', 'MANUFACTURER_PART_NUMBER',
  'ALTERNATE_PART_NUMBER', 'Classpath',
  'MOBILE_DESC', 'INVOICE_DESC', 'SHORT_DESC', 'LONG_DESC1',
  'RETAIL_DESC', 'MARKETING_DESCRIPTION',
  ...Array.from({ length: 20 }, (_, i) => `ITEM_FEATURES_${i + 1}`),
  'With', 'Standard/Approvals', 'Prop 65', 'Application', 'Includes', 'Product Name',
  ...Array.from({ length: 50 }, (_, i) => [
    `ATTRIBUTE_LABEL ${i + 1}`,
    `ATTRIBUTE_VALUE ${i + 1}`,
    `ATTRIBUTE_UOM ${i + 1}`,
  ]).flat(),
  'UPC', 'EAN', 'GTIN', 'UNSPSC', 'Warranty',
  'List Price', 'Selling Qty', 'Selling UOM', 'Standard Packaging Information',
  'LENGTH', 'LENGTH_UOM', 'HEIGHT', 'HEIGHT_UOM', 'WIDTH', 'WIDTH_UOM',
  'WEIGHT', 'WEIGHT_UOM', 'VOLUME', 'VOLUME_UOM',
  'Product Image', 'Alternate Image 1', 'Alternate Image 2', 'Alternate Image 3', 'Alternate Image 4',
  'SDS', 'SDS_1', 'Warranty Information', 'Catalog', 'Specification Sheet',
  'Instruction/Installation Manual', 'Service Manual', 'Owners/User Manual',
  'Line Drawing', 'MTR', 'RoHS', 'Full Engineering Drawing', 'Energy Star Guide',
  'Technical Bulletin', 'Submittal', 'Compatibility Chart', 'Size Chart',
  'Product Label/Insert', 'Video Link', 'Video Link 1',
  'Country Of Origin', 'Discontinued', 'Actual Image (Yes/No)',
];

type CsvRecord = Record<string, string>;

/**
 * Map an EnrichedUnilogProduct to the 252-column Unilog delivery format row.
 */
export function mapToUnilogRow(
  enriched: EnrichedUnilogProduct,
  originalRow?: Record<string, string>,
): CsvRecord {
  const row: CsvRecord = {};

  // Initialize all 252 columns to empty
  for (const header of UNILOG_CSV_HEADERS) {
    row[header] = '';
  }

  // Input passthroughs
  row['Mfg_Part_Num'] = enriched.mfg_part_num;
  row['Part_Desc'] = enriched.raw_part_desc;
  row['MANUFACTURER_PART_NUMBER'] = enriched.mfg_part_num;
  if (originalRow) {
    row['E1_Brand'] = originalRow['E1_Brand'] ?? '';
    row['Unilog_Brand'] = originalRow['Unilog_Brand'] ?? '';
    row['DIB_Brand'] = originalRow['DIB_Brand'] ?? '';
    row['Part_Manuf'] = originalRow['Part_Manuf'] ?? '';
  }

  // Resolved identifiers
  row['MANUFACTURER_NAME'] = enriched.manufacturer_name;
  row['BRAND_NAME'] = enriched.brand_name;

  // Taxonomy
  row['Classpath'] = enriched.classpath;
  row['Dept'] = enriched.dept;
  row['Class'] = enriched.class_name;
  row['Fine'] = enriched.fine;

  // 5-Tier Descriptions
  row['INVOICE_DESC'] = enriched.invoice_desc;
  row['MOBILE_DESC'] = enriched.mobile_desc;
  row['SHORT_DESC'] = enriched.short_desc;
  row['LONG_DESC1'] = enriched.long_desc;
  row['RETAIL_DESC'] = enriched.short_desc; // reuse short desc as retail
  row['MARKETING_DESCRIPTION'] = enriched.marketing_description;
  row['Product Name'] = enriched.product_name;

  // Attributes : fill into ATTRIBUTE_LABEL/VALUE/UOM triplets (up to 50 slots, we fill up to 20)
  enriched.attributes.forEach((attr: UnilogAttribute, i: number) => {
    if (i >= 50) return;
    const n = i + 1;
    row[`ATTRIBUTE_LABEL ${n}`] = attr.label;
    row[`ATTRIBUTE_VALUE ${n}`] = attr.value;
    row[`ATTRIBUTE_UOM ${n}`] = attr.uom ?? '';
  });

  // Physical dimensions from attributes (find common size attributes)
  const findAttr = (labels: string[]) =>
    enriched.attributes.find((a) => labels.some((l) => a.label.toLowerCase().includes(l.toLowerCase())));

  const weightAttr = findAttr(['Weight', 'Net Weight']);
  if (weightAttr) {
    row['WEIGHT'] = weightAttr.value;
    row['WEIGHT_UOM'] = weightAttr.uom ?? 'lb';
  }
  const lengthAttr = findAttr(['Length', 'Depth']);
  if (lengthAttr) {
    row['LENGTH'] = lengthAttr.value;
    row['LENGTH_UOM'] = lengthAttr.uom ?? 'in';
  }
  const heightAttr = findAttr(['Height']);
  if (heightAttr) {
    row['HEIGHT'] = heightAttr.value;
    row['HEIGHT_UOM'] = heightAttr.uom ?? 'in';
  }
  const widthAttr = findAttr(['Width']);
  if (widthAttr) {
    row['WIDTH'] = widthAttr.value;
    row['WIDTH_UOM'] = widthAttr.uom ?? 'in';
  }

  // Human review flag (in Warranty info field as a note)
  if (enriched.needs_human_review && enriched.review_reason) {
    row['Warranty Information'] = `NEEDS REVIEW: ${enriched.review_reason}`;
  }

  // Actual Image is unknown for AI-enriched items
  row['Actual Image (Yes/No)'] = 'No';

  return row;
}

/**
 * Build full UniHack 252-column CSV string from array of enriched products.
 */
export function buildUnilogCsv(
  rows: Array<{ enriched: EnrichedUnilogProduct; original?: Record<string, string> }>,
): string {
  const csvRows: string[] = [
    UNILOG_CSV_HEADERS.map(csvEscape).join(','),
    ...rows.map(({ enriched, original }) =>
      UNILOG_CSV_HEADERS.map((h) => csvEscape(mapToUnilogRow(enriched, original)[h] ?? '')).join(','),
    ),
  ];
  return csvRows.join('\r\n');
}

/**
 * Build full UniHack 252-column XLSX Buffer from array of enriched products.
 */
export function buildUnilogXlsx(
  rows: Array<{ enriched: EnrichedUnilogProduct; original?: Record<string, string> }>,
): Buffer {
  const dataRows = rows.map(({ enriched, original }) => {
    const mapped = mapToUnilogRow(enriched, original);
    const rowObj: Record<string, string> = {};
    for (const h of UNILOG_CSV_HEADERS) {
      rowObj[h] = mapped[h] ?? '';
    }
    return rowObj;
  });

  const worksheet = XLSX.utils.json_to_sheet(dataRows, { header: UNILOG_CSV_HEADERS });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Delivery Format');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

function csvEscape(value: string): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
