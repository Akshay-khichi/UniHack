export interface RawExtractedField {
  fieldName: string;
  canonicalName: string;
  value: string | number;
  unit?: string;
  confidence: number;           // 0–1
  pageNumber?: number;
  excerpt?: string;
  sourceType?: string;
}

export interface ExtractionResult {
  fields: RawExtractedField[];
  rawText?: string;
  processingTimeMs: number;
  model: string;
  warnings: string[];
  droppedFieldCount?: number;
}

export interface ExtractionInput {
  content: string;              // Document text content or base64 for images
  filename: string;
  mimeType: string;
  sourceType: string;
  productContext?: {
    sku?: string;
    name?: string;
    category?: string;
  };
}
