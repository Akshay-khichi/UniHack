import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Product } from '../models/Product';
import { ProductDocument } from '../models/Document';
import { AppError } from '../utils/AppError';
import { sendCreated, sendSuccess } from '../utils/apiResponse';
import { uploadToCloudinary, isCloudinaryConfigured } from '../config/cloudinary';
import { DocumentType, SourceType } from '../models/Document';

const uploadQuerySchema = z.object({
  sourceType: z.enum(['TECHNICAL_DATASHEET', 'MARKETING_DOCUMENT', 'USER_INPUT', 'AI_GENERATED'])
    .default('USER_INPUT'),
  documentType: z.enum(['TECHNICAL_DATASHEET', 'MARKETING', 'IMAGE', 'CSV', 'OTHER'])
    .default('OTHER'),
});

function mimeToResourceType(mime: string): 'raw' | 'image' {
  if (mime.startsWith('image/')) return 'image';
  return 'raw';
}

export async function uploadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) throw AppError.badRequest('No file uploaded');

    if (!isCloudinaryConfigured()) {
      throw AppError.serviceUnavailable('Cloudinary — credentials not configured');
    }

    // Validate product exists
    const product = await Product.findById(req.params.id);
    if (!product) throw AppError.notFound('Product');

    const query = uploadQuerySchema.parse(req.query);

    // Upload to Cloudinary
    const resourceType = mimeToResourceType(req.file.mimetype);
    let cloudinaryResult;
    try {
      cloudinaryResult = await uploadToCloudinary(
        req.file.buffer,
        req.file.originalname,
        `spectrace/${product._id}`,
        resourceType,
      );
    } catch (err) {
      throw AppError.externalServiceError('Cloudinary', (err as Error).message);
    }

    // Persist document record
    const doc = await ProductDocument.create({
      productId: product._id,
      type: query.documentType as DocumentType,
      name: req.file.originalname,
      url: cloudinaryResult.secure_url,
      publicId: cloudinaryResult.public_id,
      mimeType: req.file.mimetype,
      size: req.file.size,
      sourceType: query.sourceType as SourceType,
      processingStatus: 'PENDING',
    });

    sendCreated(res, doc);
  } catch (err) {
    next(err);
  }
}

export async function listDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) throw AppError.notFound('Product');

    const docs = await ProductDocument.find({ productId: req.params.id })
      .sort({ createdAt: -1 })
      .lean();

    sendSuccess(res, docs);
  } catch (err) {
    next(err);
  }
}
