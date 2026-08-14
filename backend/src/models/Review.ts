import { Schema, model, Document, Model } from 'mongoose';

export type ReviewAction = 'APPROVE' | 'EDIT' | 'REJECT' | 'MARK_UNVERIFIED';
export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EDITED';

export interface IReview {
  productId: Schema.Types.ObjectId;
  fieldName?: string;
  canonicalName?: string;
  contradictionGroupId?: string;
  status: ReviewStatus;
  action?: ReviewAction;
  originalValue?: string | number;
  originalUnit?: string;
  editedValue?: string | number;
  editedUnit?: string;
  reviewedBy?: string;
  reviewNote?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReviewDocument extends IReview, Document {}

const reviewSchema = new Schema<IReviewDocument>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    fieldName: { type: String, trim: true },
    canonicalName: { type: String, trim: true, index: true },
    contradictionGroupId: { type: String, index: true },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'EDITED'],
      default: 'PENDING',
      index: true,
    },
    action: {
      type: String,
      enum: ['APPROVE', 'EDIT', 'REJECT', 'MARK_UNVERIFIED'],
    },
    originalValue: { type: Schema.Types.Mixed },
    originalUnit: { type: String },
    editedValue: { type: Schema.Types.Mixed },
    editedUnit: { type: String },
    reviewedBy: { type: String, trim: true, maxlength: 200 },
    reviewNote: { type: String, maxlength: 2000 },
    reviewedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

reviewSchema.index({ productId: 1, status: 1 });
reviewSchema.index({ productId: 1, contradictionGroupId: 1 });

export const Review: Model<IReviewDocument> = model<IReviewDocument>('Review', reviewSchema);
