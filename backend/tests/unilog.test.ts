import {
  normalizeUom,
  formatMeasurement,
  decimalToFraction,
  checkFractionApproximationWarning,
  cleanPlaceholder,
  parseManufacturerField,
} from '../src/services/enrichment/unilogNormalization';
import {
  buildUnilogCsv,
  mapToUnilogRow,
  UNILOG_CSV_HEADERS,
} from '../src/services/enrichment/unilogCsvExport';
import { EnrichedUnilogProduct } from '../src/services/enrichment/unilogEnrichmentService';
import { runUnilogEvaluation } from '../src/services/evaluation/unilogEvaluationService';

describe('UniHack Normalization Utilities', () => {
  test('normalizeUom converts common variations to canonical UniHack UOMs', () => {
    expect(normalizeUom('inches')).toBe('in');
    expect(normalizeUom('inch')).toBe('in');
    expect(normalizeUom('"')).toBe('in');
    expect(normalizeUom('pounds')).toBe('lb');
    expect(normalizeUom('lbs')).toBe('lb');
    expect(normalizeUom('volts')).toBe('V');
    expect(normalizeUom('deg F')).toBe('°F');
  });

  test('formatMeasurement formats value and unit with a single space', () => {
    expect(formatMeasurement(24, 'inch')).toBe('24 in');
    expect(formatMeasurement(120, 'volts')).toBe('120 V');
  });

  test('decimalToFraction converts decimal inches to exact fraction or 1/64 approximation', () => {
    expect(decimalToFraction(0.5)).toBe('1/2');
    expect(decimalToFraction(0.25)).toBe('1/4');
    expect(decimalToFraction(0.75)).toBe('3/4');
    expect(decimalToFraction(12.5)).toBe('12-1/2');
    // Test fraction approximation algorithm for unmapped decimal
    expect(decimalToFraction(0.333333)).toBe('21/64');
  });

  test('checkFractionApproximationWarning returns warning for high delta approximations', () => {
    expect(checkFractionApproximationWarning(0.5)).toBeNull();
    expect(checkFractionApproximationWarning(0.333333)).toContain('delta');
  });

  test('cleanPlaceholder identifies and strips known placeholder strings', () => {
    expect(cleanPlaceholder('-- Unbranded --')).toBeNull();
    expect(cleanPlaceholder('-- No Unilog Brand --')).toBeNull();
    expect(cleanPlaceholder('N/A')).toBeNull();
    expect(cleanPlaceholder('Acme Corp')).toBe('Acme Corp');
  });

  test('parseManufacturerField extracts manufacturer name and code', () => {
    expect(parseManufacturerField('Frigidaire (FRIG)')).toEqual({
      name: 'Frigidaire',
      code: 'FRIG',
    });
    expect(parseManufacturerField('Rheem Manufacturing')).toEqual({
      name: 'Rheem Manufacturing',
      code: null,
    });
  });
});

describe('UniHack 252-Column CSV Export', () => {
  test('UNILOG_CSV_HEADERS has exactly 252 static columns', () => {
    expect(UNILOG_CSV_HEADERS.length).toBe(252);
    expect(UNILOG_CSV_HEADERS[0]).toBe('MFR URL');
    expect(UNILOG_CSV_HEADERS[251]).toBe('Actual Image (Yes/No)');
  });

  test('mapToUnilogRow populates 5-tier descriptions and attributes correctly', () => {
    const mockEnriched: EnrichedUnilogProduct = {
      mfg_part_num: 'PDSH4816AF',
      raw_part_desc: 'DISHWASHER LEG SST',
      manufacturer_name: 'Frigidaire',
      brand_name: 'Frigidaire',
      classpath: 'Appliances > Kitchen > Dishwashers',
      dept: 'Appliances',
      class_name: 'Kitchen Appliances',
      fine: 'Dishwashers',
      invoice_desc: 'DISHWASHER LEG 5 SST 120V',
      mobile_desc: 'Frigidaire, Dishwasher, PDSH4816AF',
      short_desc: 'Frigidaire Professional Series Dishwasher Stainless Steel',
      long_desc: 'Frigidaire Professional Series Dishwasher with Stainless Steel finish',
      marketing_description: 'High performance dishwasher built for modern kitchens.',
      product_name: 'Dishwasher',
      attributes: [
        { label: 'Color', value: 'Stainless Steel', uom: null, confidence: 0.95 },
        { label: 'Voltage Rating', value: '120', uom: 'V', confidence: 0.9 },
      ],
      overall_confidence: 0.92,
      needs_human_review: false,
      review_reason: null,
      warnings: [],
    };

    const row = mapToUnilogRow(mockEnriched);
    expect(row['Mfg_Part_Num']).toBe('PDSH4816AF');
    expect(row['INVOICE_DESC']).toBe('DISHWASHER LEG 5 SST 120V');
    expect(row['MOBILE_DESC']).toBe('Frigidaire, Dishwasher, PDSH4816AF');
    expect(row['SHORT_DESC']).toBe('Frigidaire Professional Series Dishwasher Stainless Steel');
    expect(row['ATTRIBUTE_LABEL 1']).toBe('Color');
    expect(row['ATTRIBUTE_VALUE 1']).toBe('Stainless Steel');
    expect(row['ATTRIBUTE_LABEL 2']).toBe('Voltage Rating');
    expect(row['ATTRIBUTE_VALUE 2']).toBe('120');
    expect(row['ATTRIBUTE_UOM 2']).toBe('V');
  });

  test('buildUnilogCsv produces valid CSV content with header row', () => {
    const mockEnriched: EnrichedUnilogProduct = {
      mfg_part_num: 'TEST-123',
      raw_part_desc: 'TEST DESC',
      manufacturer_name: 'Test Manuf',
      brand_name: 'Test Brand',
      classpath: 'Test > Class',
      dept: 'Test',
      class_name: 'Class',
      fine: 'Fine',
      invoice_desc: 'TEST DESC',
      mobile_desc: 'Test Mobile Desc',
      short_desc: 'Test Short Desc',
      long_desc: 'Test Long Desc',
      marketing_description: 'Test Marketing Desc',
      product_name: 'Test Item',
      attributes: [],
      overall_confidence: 0.9,
      needs_human_review: false,
      review_reason: null,
      warnings: [],
    };

    const csv = buildUnilogCsv([{ enriched: mockEnriched }]);
    const lines = csv.split('\r\n');
    expect(lines.length).toBe(2);
    expect(lines[0].split(',').length).toBe(252);
  });
});

describe('UniHack Evaluation Benchmark Service', () => {
  test('runUnilogEvaluation supports held_out validation split and reports explicit dataset_type', async () => {
    const report = await runUnilogEvaluation(2, 'held_out');
    expect(report.dataset_type).toBe('held_out_validation');
    expect(report.total_rows_sampled).toBeGreaterThan(0);
    expect(report.metrics.length).toBe(6);
    expect(report.metrics.find((m) => m.category === 'Placeholder Cleaning')).toBeDefined();
    expect(report.metrics.find((m) => m.category === 'UOM Standardization')).toBeDefined();
  });
});
