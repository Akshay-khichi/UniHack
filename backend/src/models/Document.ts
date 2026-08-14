import { Schema, model, Document, Model } from 'mongoose';

export type DocumentType = 'TECHNICAL_DATASHEET' | 'MARKETING' | 'IMAGE' | 'CSV' | 'OTHER';
export type ProcessingStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type SourceType = 'TECHNICAL_DATASHEET' | 'MARKETING_DOCUMENT' | 'USER_INPUT' | 'AI_GENERATED';

export interface IDocument {
  productId: Schema.Types.ObjectId;
  type: DocumentType;
  name: string;
  url: string;
  publicId: string;  // Cloudinary public_id for deletion
  mimeType: string;
  size: number;
  sourceType: SourceType;
  processingStatus: ProcessingStatus;
  processingError?: string;
  extractedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDocumentDocument extends IDocument, Document {}

const documentSchema = new Schema<IDocumentDocument>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'productId is required'],
      index: true,
    },
    type: {
      type: String,
      enum: ['TECHNICAL_DATASHEET', 'MARKETING', 'IMAGE', 'CSV', 'OTHER'],
      required: [true, 'Document type is required'],
    },
    name: {
      type: String,
      required: [true, 'Document name is required'],
      trim: true,
      maxlength: 500,
    },
    url: {
      type: String,
      required: [true, 'Document URL is required'],
    },
    publicId: {
      type: String,
      required: [true, 'Cloudinary publicId is required'],
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
    },
    size: {
      type: Number,
      required: [true, 'File size is required'],
      min: 0,
    },
    sourceType: {
      type: String,
      enum: ['TECHNICAL_DATASHEET', 'MARKETING_DOCUMENT', 'USER_INPUT', 'AI_GENERATED'],
      required: [true, 'Source type is required'],
    },
    processingStatus: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
    },
    processingError: { type: String },
    extractedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

documentSchema.index({ productId: 1, createdAt: -1 });
documentSchema.index({ processingStatus: 1 });

export const ProductDocument: Model<IDocumentDocument> = model<IDocumentDocument>(
  'Document',
  documentSchema,
);
