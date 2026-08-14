import { Schema, model, Document, Model } from 'mongoose';

export type VerificationStatus = 'VERIFIED' | 'UNVERIFIED' | 'CONTRADICTED' | 'PENDING';
export type EvidenceSourceType = 'TECHNICAL_DATASHEET' | 'MARKETING_DOCUMENT' | 'USER_INPUT' | 'AI_GENERATED';

export interface IEvidence {
  productId: Schema.Types.ObjectId;
  documentId: Schema.Types.ObjectId;
  fieldName: string;
  canonicalName: string;
  value: string | number;
  unit?: string;
  sourceType: EvidenceSourceType;
  pageNumber?: number;
  excerpt?: string;
  verificationStatus: VerificationStatus;
  verificationConfidence: number;
  verificationReasoning?: string;
  extractionConfidence: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEvidenceDocument extends IEvidence, Document {}

const evidenceSchema = new Schema<IEvidenceDocument>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
    },
    fieldName: { type: String, required: true, trim: true },
    canonicalName: { type: String, required: true, trim: true, index: true },
    value: { type: Schema.Types.Mixed, required: true },
    unit: { type: String, trim: true },
    sourceType: {
      type: String,
      enum: ['TECHNICAL_DATASHEET', 'MARKETING_DOCUMENT', 'USER_INPUT', 'AI_GENERATED'],
      required: true,
    },
    pageNumber: { type: Number },
    excerpt: { type: String, maxlength: 1000 },
    verificationStatus: {
      type: String,
      enum: ['VERIFIED', 'UNVERIFIED', 'CONTRADICTED', 'PENDING'],
      default: 'PENDING',
    },
    verificationConfidence: { type: Number, default: 0, min: 0, max: 1 },
    verificationReasoning: { type: String, maxlength: 2000 },
    extractionConfidence: { type: Number, default: 0, min: 0, max: 1 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

evidenceSchema.index({ productId: 1, canonicalName: 1 });
evidenceSchema.index({ documentId: 1 });

export const Evidence: Model<IEvidenceDocument> = model<IEvidenceDocument>('Evidence', evidenceSchema);
