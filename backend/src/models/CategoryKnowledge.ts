import { Schema, model, Document, Model } from 'mongoose';

export interface ICategoryKnowledge {
  category: string;
  fieldName: string;
  typicalValues?: Array<{ value: string | number; unit?: string }>;
  typicalRange?: { min?: number; max?: number; unit?: string };
  description?: string;
  embedding?: number[];    // stored for Atlas Vector Search
  embeddingText: string;   // text that was embedded
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategoryKnowledgeDocument extends ICategoryKnowledge, Document {}

const categoryKnowledgeSchema = new Schema<ICategoryKnowledgeDocument>(
  {
    category: { type: String, required: true, trim: true, index: true },
    fieldName: { type: String, required: true, trim: true },
    typicalValues: [
      {
        value: { type: Schema.Types.Mixed },
        unit: { type: String },
        _id: false,
      },
    ],
    typicalRange: {
      min: { type: Number },
      max: { type: Number },
      unit: { type: String },
      _id: false,
    },
    description: { type: String, maxlength: 2000 },
    embedding: { type: [Number], select: false }, // exclude by default, only fetch when needed
    embeddingText: { type: String, required: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

categoryKnowledgeSchema.index({ category: 1, fieldName: 1 });
// Vector search index configured in Atlas UI on `embedding` field

export const CategoryKnowledge: Model<ICategoryKnowledgeDocument> = model<ICategoryKnowledgeDocument>(
  'CategoryKnowledge',
  categoryKnowledgeSchema,
);
