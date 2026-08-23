import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  getReviewQueue,
  approveReview,
  editReview,
  rejectReview,
  markUnverified,
} from '../services/review/reviewService';
import { getVersionHistory } from '../services/review/versioningService';
import { Review } from '../models/Review';
import { AppError } from '../utils/AppError';
import { sendSuccess } from '../utils/apiResponse';

const approveSchema = z.object({
  reviewedBy: z.string().min(1).max(200).default('system'),
  reviewNote: z.string().max(2000).optional(),
});

const editSchema = z.object({
  editedValue: z.union([z.string(), z.number()]),
  editedUnit: z.string().max(50).optional(),
  reviewedBy: z.string().min(1).max(200).default('system'),
  reviewNote: z.string().max(2000).optional(),
});

import mongoose from 'mongoose';

export async function getQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      sendSuccess(res, []);
      return;
    }
    const items = await getReviewQueue(req.params.productId as string);
    sendSuccess(res, items);
  } catch (err) {
    sendSuccess(res, []);
  }
}

export async function getAllReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      sendSuccess(res, []);
      return;
    }
    const reviews = await Review.find({ productId: req.params.productId as string })
      .sort({ createdAt: -1 })
      .lean();
    sendSuccess(res, reviews);
  } catch (err) {
    sendSuccess(res, []);
  }
}

export async function approve(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = approveSchema.parse(req.body);
    const review = await approveReview(req.params.reviewId as string, body.reviewedBy, body.reviewNote);
    sendSuccess(res, review);
  } catch (err) {
    next(err instanceof Error && err.message.includes('not found') ? AppError.notFound('Review') : err);
  }
}

export async function edit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = editSchema.parse(req.body);
    const review = await editReview(
      req.params.reviewId as string,
      body.editedValue,
      body.editedUnit,
      body.reviewedBy,
      body.reviewNote,
    );
    sendSuccess(res, review);
  } catch (err) {
    next(err instanceof Error && err.message.includes('not found') ? AppError.notFound('Review') : err);
  }
}

export async function reject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = approveSchema.parse(req.body);
    const review = await rejectReview(req.params.reviewId as string, body.reviewedBy, body.reviewNote);
    sendSuccess(res, review);
  } catch (err) {
    next(err instanceof Error && err.message.includes('not found') ? AppError.notFound('Review') : err);
  }
}

export async function markFieldUnverified(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = approveSchema.parse(req.body);
    const review = await markUnverified(req.params.reviewId as string, body.reviewedBy, body.reviewNote);
    sendSuccess(res, review);
  } catch (err) {
    next(err instanceof Error && err.message.includes('not found') ? AppError.notFound('Review') : err);
  }
}

export async function getVersions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const versions = await getVersionHistory(req.params.productId as string);
    sendSuccess(res, versions);
  } catch (err) {
    next(err);
  }
}
