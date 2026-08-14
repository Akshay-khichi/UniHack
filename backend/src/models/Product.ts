import { Schema, model, Document, Model } from 'mongoose';

// ── Enums ────────────────────────────────────────────────────────────────────

export type ProductStatus =
  | 'DRAFT'
  | 'PROCESSING'
  | 'REVIEW_REQUIRED'
  | 'APPROVED'
  | 'REJECTED'
  | 'ARCHIVED';

export type FieldStatus = 'FACT' | 'AI_INFERENCE' | 'UNVERIFIED' | 'CONFLICT' | 'REVIEW_REQUIRED';

// ── Quality Breakdown ────────────────────────────────────────────────────────

export interface QualityBreakdown {
  completeness: number;       // 0–1
  sourceCoverage: number;     // 0–1
  validationScore: number;    // 0–1
  confidenceScore: number;    // 0–1
  contradictionPenalty: number; // 0–1 (penalty applied)
  unverifiedPenalty: number;  // 0–1 (penalty applied)
}

// ── Interfaces ───────────────────────────────────────────────────────────────

export interface IProduct {
  sku: string;
  name: string;
  brand?: string;
  category?: string;
  description?: string;
  status: ProductStatus;
  qualityScore: number;
  qualityBreakdown: QualityBreakdown;
  overallConfidence: number;
  currentVersion?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductDocument extends IProduct, Document {}

// ── Schema ───────────────────────────────────────────────────────────────────

const qualityBreakdownSchema = new Schema<QualityBreakdown>(
  {
    completeness: { type: Number, default: 0, min: 0, max: 1 },
    sourceCoverage: { type: Number, default: 0, min: 0, max: 1 },
    validationScore: { type: Number, default: 0, min: 0, max: 1 },
    confidenceScore: { type: Number, default: 0, min: 0, max: 1 },
    contradictionPenalty: { type: Number, default: 0, min: 0, max: 1 },
    unverifiedPenalty: { type: Number, default: 0, min: 0, max: 1 },
  },
  { _id: false },
);

const productSchema = new Schema<IProductDocument>(
  {
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [100, 'SKU must be 100 characters or fewer'],
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [500, 'Name must be 500 characters or fewer'],
    },
    brand: { type: String, trim: true, maxlength: 200 },
    category: { type: String, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 5000 },
    status: {
      type: String,
      enum: ['DRAFT', 'PROCESSING', 'REVIEW_REQUIRED', 'APPROVED', 'REJECTED', 'ARCHIVED'],
      default: 'DRAFT',
    },
    qualityScore: { type: Number, default: 0, min: 0, max: 100 },
    qualityBreakdown: { type: qualityBreakdownSchema, default: () => ({}) },
    overallConfidence: { type: Number, default: 0, min: 0, max: 1 },
    currentVersion: { type: Schema.Types.ObjectId, ref: 'ProductVersion' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ── Indexes ──────────────────────────────────────────────────────────────────

// Indexes (sku unique index created by schema definition above — not duplicated here)
productSchema.index({ name: 'text', description: 'text', brand: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ status: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ qualityScore: -1 });

// ── Model ────────────────────────────────────────────────────────────────────

export const Product: Model<IProductDocument> = model<IProductDocument>('Product', productSchema);
