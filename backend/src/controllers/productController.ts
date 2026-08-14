import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Product } from '../models/Product';
import { AppError } from '../utils/AppError';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/apiResponse';

// ── Zod Schemas ──────────────────────────────────────────────────────────────

const createProductSchema = z.object({
  sku: z.string().min(1).max(100),
  name: z.string().min(1).max(500),
  brand: z.string().max(200).optional(),
  category: z.string().max(200).optional(),
  description: z.string().max(5000).optional(),
});

const updateProductSchema = createProductSchema.partial();

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['DRAFT', 'PROCESSING', 'REVIEW_REQUIRED', 'APPROVED', 'REJECTED', 'ARCHIVED']).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'qualityScore']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ── Controllers ──────────────────────────────────────────────────────────────

export async function createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = createProductSchema.parse(req.body);
    const existing = await Product.findOne({ sku: body.sku.toUpperCase() });
    if (existing) throw AppError.conflict(`Product with SKU '${body.sku}' already exists`);

    const product = await Product.create(body);
    sendCreated(res, product);
  } catch (err) {
    next(err);
  }
}

export async function listProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = listQuerySchema.parse(req.query);
    const { page, limit, search, category, status, sortBy, sortOrder } = query;

    // Build filter : sanitized (no $where or $regex injection)
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (category) filter.category = { $regex: new RegExp(`^${escapeRegex(category)}$`, 'i') };
    if (search) {
      filter.$text = { $search: search };
    }

    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);

    sendSuccess(res, products, 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
}

export async function getProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) throw AppError.notFound('Product');
    sendSuccess(res, product);
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = updateProductSchema.parse(req.body);
    if (Object.keys(body).length === 0) throw AppError.badRequest('No update fields provided');

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: body },
      { new: true, runValidators: true },
    ).lean();

    if (!product) throw AppError.notFound('Product');
    sendSuccess(res, product);
  } catch (err) {
    next(err);
  }
}

export async function deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) throw AppError.notFound('Product');
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
