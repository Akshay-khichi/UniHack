import { Product } from '../../models/Product';
import { ProductDocument } from '../../models/Document';
import { Evidence } from '../../models/Evidence';
import { ExtractedField } from '../../models/ExtractedField';
import { ProductVersion } from '../../models/ProductVersion';
import { Review } from '../../models/Review';
import { AppError } from '../../utils/AppError';

export interface JsonExport {
  product: unknown;
  documents: unknown[];
  evidence: unknown[];
  extractedFields: unknown[];
  versions: unknown[];
  reviews: unknown[];
  exportedAt: string;
}

export interface CsvRow {
  SKU: string;
  ProductName: string;
  CanonicalField: string;
  Value: string;
  Unit: string;
  Page: string;
  Excerpt: string;
  DocumentId: string;
  SourceType: string;
  Status: string;
  Confidence: string;
  ContradictionGroupId: string;
  CreatedAt: string;
}

/**
 * Export product data as a structured JSON object.
 */
export async function exportAsJson(productId: string): Promise<JsonExport> {
  const product = await Product.findById(productId).lean();
  if (!product) throw AppError.notFound('Product');

  const [documents, evidence, extractedFields, versions, reviews] = await Promise.all([
    ProductDocument.find({ productId }).lean(),
    Evidence.find({ productId }).lean(),
    ExtractedField.find({ productId }).lean(),
    ProductVersion.find({ productId }).sort({ version: -1 }).lean(),
    Review.find({ productId }).sort({ createdAt: -1 }).lean(),
  ]);

  return {
    product,
    documents,
    evidence,
    extractedFields,
    versions,
    reviews,
    exportedAt: new Date().toISOString(),
  };
}

/**
 * Export product field-level traceability as CSV string.
 * Handles all CSV escaping per RFC 4180.
 */
export async function exportAsCsv(productId: string): Promise<string> {
  const product = await Product.findById(productId).lean();
  if (!product) throw AppError.notFound('Product');

  const extractedFields = await ExtractedField.find({ productId }).lean();

  const headers: (keyof CsvRow)[] = [
    'SKU',
    'ProductName',
    'CanonicalField',
    'Value',
    'Unit',
    'Page',
    'Excerpt',
    'DocumentId',
    'SourceType',
    'Status',
    'Confidence',
    'ContradictionGroupId',
    'CreatedAt',
  ];

  const rows: CsvRow[] = extractedFields.map((f) => ({
    SKU: (product as Record<string, unknown>).sku as string || '',
    ProductName: (product as Record<string, unknown>).name as string || '',
    CanonicalField: f.canonicalName || '',
    Value: String(f.value ?? ''),
    Unit: f.unit || '',
    Page: f.pageNumber != null ? String(f.pageNumber) : '',
    Excerpt: f.excerpt || '',
    DocumentId: f.documentId ? String(f.documentId) : '',
    SourceType: f.sourceType || '',
    Status: f.status || '',
    Confidence: f.confidence != null ? f.confidence.toFixed(4) : '',
    ContradictionGroupId: f.contradictionGroupId || '',
    CreatedAt: f.createdAt ? new Date(f.createdAt).toISOString() : '',
  }));

  const lines: string[] = [
    headers.map(csvEscape).join(','),
    ...rows.map((row) => headers.map((h) => csvEscape(row[h])).join(',')),
  ];

  return lines.join('\r\n');
}

/**
 * CSV escape per RFC 4180 — wrap in quotes if value contains comma, quote, or newline.
 */
function csvEscape(value: string): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
