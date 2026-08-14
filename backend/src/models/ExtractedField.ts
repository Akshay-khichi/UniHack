import { Schema, model, Document, Model } from 'mongoose';
import { FieldStatus } from './Product';

export interface IExtractedField {
  productId: Schema.Types.ObjectId;
  documentId?: Schema.Types.ObjectId;
  fieldName: string;
  canonicalName: string;
  value: string | number;
  unit?: string;
  originalValue: string | number;
  originalUnit?: string;
  status: FieldStatus;
  confidence: number;
  sourceType?: string;
  pageNumber?: number;
  excerpt?: string;
  contradictionGroupId?: string;
  contradictingValues?: Array<{
    value: string | number;
    unit?: string;
    sourceType: string;
    documentId?: string;
    excerpt?: string;
  }>;
  validationErrors?: Array<{ code: string; message: string }>;
  reviewId?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IExtractedFieldDocument extends IExtractedField, Document {}

const extractedFieldSchema = new Schema<IExtractedFieldDocument>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    documentId: { type: Schema.Types.ObjectId, ref: 'Document' },
    fieldName: { type: String, required: true, trim: true },
    canonicalName: { type: String, required: true, trim: true },
    value: { type: Schema.Types.Mixed, required: true },
    unit: { type: String, trim: true },
    originalValue: { type: Schema.Types.Mixed, required: true },
    originalUnit: { type: String, trim: true },
    status: {
      type: String,
      enum: ['FACT', 'AI_INFERENCE', 'UNVERIFIED', 'CONFLICT', 'REVIEW_REQUIRED'],
      required: true,
    },
    confidence: { type: Number, default: 0, min: 0, max: 1 },
    sourceType: { type: String },
    pageNumber: { type: Number },
    excerpt: { type: String, maxlength: 1000 },
    contradictionGroupId: { type: String, index: true },
    contradictingValues: [
      {
        value: { type: Schema.Types.Mixed },
        unit: { type: String },
        sourceType: { type: String },
        documentId: { type: String },
        excerpt: { type: String },
        _id: false,
      },
    ],
    validationErrors: [
      {
        code: { type: String },
        message: { type: String },
        _id: false,
      },
    ],
    reviewId: { type: Schema.Types.ObjectId, ref: 'Review' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

extractedFieldSchema.index({ productId: 1, canonicalName: 1 });
extractedFieldSchema.index({ productId: 1, status: 1 });

export const ExtractedField: Model<IExtractedFieldDocument> = model<IExtractedFieldDocument>(
  'ExtractedField',
  extractedFieldSchema,
);
