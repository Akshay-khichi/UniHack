/**
 * Export service tests — no DB required, mocked mongoose models.
 */

jest.mock('../src/models/Product', () => ({
  Product: { findById: jest.fn() },
}));
jest.mock('../src/models/Document', () => ({
  ProductDocument: { find: jest.fn() },
}));
jest.mock('../src/models/Evidence', () => ({
  Evidence: { find: jest.fn() },
}));
jest.mock('../src/models/ExtractedField', () => ({
  ExtractedField: { find: jest.fn() },
}));
jest.mock('../src/models/ProductVersion', () => ({
  ProductVersion: { find: jest.fn() },
}));
jest.mock('../src/models/Review', () => ({
  Review: { find: jest.fn() },
}));

import { exportAsJson, exportAsCsv } from '../src/services/export/exportService';
import { Product } from '../src/models/Product';
import { ProductDocument } from '../src/models/Document';
import { Evidence } from '../src/models/Evidence';
import { ExtractedField } from '../src/models/ExtractedField';
import { ProductVersion } from '../src/models/ProductVersion';
import { Review } from '../src/models/Review';

const mockProduct = { _id: 'prod123', sku: 'HC-5020', name: 'Test Product', status: 'APPROVED' };

const mockField = {
  _id: 'field1',
  canonicalName: 'maximumPressure',
  value: 210,
  unit: 'bar',
  status: 'CONFLICT',
  confidence: 0.85,
  sourceType: 'TECHNICAL_DATASHEET',
  pageNumber: 3,
  excerpt: 'Maximum operating pressure: 210 bar',
  documentId: 'doc1',
  contradictionGroupId: 'abc123',
  createdAt: new Date('2024-01-01'),
};

function mockLean(result: unknown) {
  return { lean: () => result, sort: () => ({ lean: () => result }) };
}

beforeEach(() => {
  jest.clearAllMocks();
  (Product.findById as jest.Mock).mockReturnValue({ lean: () => mockProduct });
  (ProductDocument.find as jest.Mock).mockReturnValue(mockLean([]));
  (Evidence.find as jest.Mock).mockReturnValue(mockLean([]));
  (ExtractedField.find as jest.Mock).mockReturnValue(mockLean([mockField]));
  (ProductVersion.find as jest.Mock).mockReturnValue({ sort: () => ({ lean: () => [] }) });
  (Review.find as jest.Mock).mockReturnValue({ sort: () => ({ lean: () => [] }) });
});

describe('exportAsJson', () => {
  it('throws 404 if product not found', async () => {
    (Product.findById as jest.Mock).mockReturnValue({ lean: () => null });
    await expect(exportAsJson('missing')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('returns correct structure', async () => {
    const result = await exportAsJson('prod123');
    expect(result).toHaveProperty('product');
    expect(result).toHaveProperty('documents');
    expect(result).toHaveProperty('evidence');
    expect(result).toHaveProperty('extractedFields');
    expect(result).toHaveProperty('versions');
    expect(result).toHaveProperty('reviews');
    expect(result).toHaveProperty('exportedAt');
  });
});

describe('exportAsCsv', () => {
  it('throws 404 if product not found', async () => {
    (Product.findById as jest.Mock).mockReturnValue({ lean: () => null });
    await expect(exportAsCsv('missing')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('returns valid CSV with headers', async () => {
    const csv = await exportAsCsv('prod123');
    const lines = csv.split('\r\n');
    expect(lines[0]).toContain('SKU');
    expect(lines[0]).toContain('CanonicalField');
    expect(lines[0]).toContain('ContradictionGroupId');
    expect(lines.length).toBeGreaterThan(1); // header + at least 1 data row
  });

  it('includes field data in CSV', async () => {
    const csv = await exportAsCsv('prod123');
    expect(csv).toContain('HC-5020');
    expect(csv).toContain('maximumPressure');
    expect(csv).toContain('210');
    expect(csv).toContain('CONFLICT');
  });

  it('escapes commas in CSV values', async () => {
    const fieldWithComma = { ...mockField, excerpt: 'pressure, max: 210 bar' };
    (ExtractedField.find as jest.Mock).mockReturnValue(mockLean([fieldWithComma]));
    const csv = await exportAsCsv('prod123');
    // Value with comma should be quoted
    expect(csv).toContain('"pressure, max: 210 bar"');
  });

  it('escapes double quotes in CSV values', async () => {
    const fieldWithQuote = { ...mockField, excerpt: 'value is "210"' };
    (ExtractedField.find as jest.Mock).mockReturnValue(mockLean([fieldWithQuote]));
    const csv = await exportAsCsv('prod123');
    expect(csv).toContain('"value is ""210"""');
  });
});
