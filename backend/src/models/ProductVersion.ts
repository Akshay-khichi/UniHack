import { Schema, model, Document, Model } from 'mongoose';

export interface IProductVersion {
  productId: Schema.Types.ObjectId;
  version: number;
  snapshot: Record<string, unknown>;  // full product state at this version
  changedBy?: string;
  changeNote?: string;
  reviewId?: Schema.Types.ObjectId;
  createdAt: Date;
}

export interface IProductVersionDocument extends IProductVersion, Document {}

const productVersionSchema = new Schema<IProductVersionDocument>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    version: {
      type: Number,
      required: true,
    },
    snapshot: {
      type: Schema.Types.Mixed,
      required: true,
    },
    changedBy: { type: String, trim: true, maxlength: 200 },
    changeNote: { type: String, maxlength: 2000 },
    reviewId: { type: Schema.Types.ObjectId, ref: 'Review' },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // immutable — no updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

productVersionSchema.index({ productId: 1, version: -1 });

// Prevent any updates to version records
productVersionSchema.pre('save', function (next) {
  if (!this.isNew) {
    next(new Error('ProductVersion records are immutable'));
    return;
  }
  next();
});

export const ProductVersion: Model<IProductVersionDocument> = model<IProductVersionDocument>(
  'ProductVersion',
  productVersionSchema,
);
