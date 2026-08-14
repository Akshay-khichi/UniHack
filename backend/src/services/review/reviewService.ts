import { Review, IReviewDocument } from '../../models/Review';
import { ExtractedField } from '../../models/ExtractedField';
import { Product } from '../../models/Product';
import { createProductVersion } from './versioningService';
import { logger } from '../../utils/logger';

export interface ReviewQueueItem {
  review: IReviewDocument;
  fieldDetails?: {
    value: unknown;
    unit?: string;
    contradictingValues?: unknown[];
  };
}

/**
 * Get pending review items for a product.
 */
export async function getReviewQueue(productId: string): Promise<ReviewQueueItem[]> {
  const reviews = await Review.find({ productId, status: 'PENDING' }).sort({ createdAt: 1 }).lean();

  const items: ReviewQueueItem[] = [];
  for (const review of reviews) {
    let fieldDetails;
    if (review.canonicalName) {
      const field = await ExtractedField.findOne({
        productId,
        canonicalName: review.canonicalName,
      }).lean();
      if (field) {
        fieldDetails = {
          value: field.value,
          unit: field.unit,
          contradictingValues: field.contradictingValues,
        };
      }
    }
    items.push({ review: review as unknown as IReviewDocument, fieldDetails });
  }

  return items;
}

/**
 * Approve a review item — field status becomes FACT.
 * Creates a product version snapshot.
 */
export async function approveReview(
  reviewId: string,
  reviewedBy: string,
  reviewNote?: string,
): Promise<IReviewDocument> {
  const review = await Review.findById(reviewId);
  if (!review) throw new Error(`Review ${reviewId} not found`);
  if (review.status !== 'PENDING') throw new Error(`Review ${reviewId} is not pending`);

  // Update the extracted field to FACT
  if (review.canonicalName) {
    await ExtractedField.updateMany(
      { productId: review.productId, canonicalName: review.canonicalName },
      { $set: { status: 'FACT', reviewId: review._id } },
    );
  }

  // Update review record
  review.status = 'APPROVED';
  review.action = 'APPROVE';
  review.reviewedBy = reviewedBy;
  review.reviewNote = reviewNote;
  review.reviewedAt = new Date();
  await review.save();

  // Create immutable version snapshot
  await createProductVersion(
    String(review.productId),
    reviewedBy,
    `Approved: ${review.canonicalName || 'field'}`,
    String(review._id),
  );

  await updateProductStatusFromReviews(String(review.productId));
  logger.info({ reviewId, field: review.canonicalName }, 'Review approved');
  return review;
}

/**
 * Edit a review item — field updated with human-provided value, status → FACT.
 */
export async function editReview(
  reviewId: string,
  editedValue: string | number,
  editedUnit: string | undefined,
  reviewedBy: string,
  reviewNote?: string,
): Promise<IReviewDocument> {
  const review = await Review.findById(reviewId);
  if (!review) throw new Error(`Review ${reviewId} not found`);
  if (review.status !== 'PENDING') throw new Error(`Review ${reviewId} is not pending`);

  // Capture original value
  if (review.canonicalName) {
    const field = await ExtractedField.findOne({
      productId: review.productId,
      canonicalName: review.canonicalName,
    });
    if (field) {
      review.originalValue = field.value as string | number;
      review.originalUnit = field.unit;

      // Apply edit
      await ExtractedField.updateMany(
        { productId: review.productId, canonicalName: review.canonicalName },
        {
          $set: {
            value: editedValue,
            unit: editedUnit,
            originalValue: field.originalValue,
            status: 'FACT',
            reviewId: review._id,
          },
        },
      );
    }
  }

  review.status = 'EDITED';
  review.action = 'EDIT';
  review.editedValue = editedValue;
  review.editedUnit = editedUnit;
  review.reviewedBy = reviewedBy;
  review.reviewNote = reviewNote;
  review.reviewedAt = new Date();
  await review.save();

  await createProductVersion(
    String(review.productId),
    reviewedBy,
    `Edited: ${review.canonicalName || 'field'} → ${editedValue}${editedUnit ? ` ${editedUnit}` : ''}`,
    String(review._id),
  );

  await updateProductStatusFromReviews(String(review.productId));
  logger.info({ reviewId, field: review.canonicalName, editedValue }, 'Review edited');
  return review;
}

/**
 * Reject a review item — field marked UNVERIFIED.
 */
export async function rejectReview(
  reviewId: string,
  reviewedBy: string,
  reviewNote?: string,
): Promise<IReviewDocument> {
  const review = await Review.findById(reviewId);
  if (!review) throw new Error(`Review ${reviewId} not found`);
  if (review.status !== 'PENDING') throw new Error(`Review ${reviewId} is not pending`);

  if (review.canonicalName) {
    await ExtractedField.updateMany(
      { productId: review.productId, canonicalName: review.canonicalName },
      { $set: { status: 'UNVERIFIED', reviewId: review._id } },
    );
  }

  review.status = 'REJECTED';
  review.action = 'REJECT';
  review.reviewedBy = reviewedBy;
  review.reviewNote = reviewNote;
  review.reviewedAt = new Date();
  await review.save();

  await createProductVersion(
    String(review.productId),
    reviewedBy,
    `Rejected: ${review.canonicalName || 'field'}`,
    String(review._id),
  );

  await updateProductStatusFromReviews(String(review.productId));
  logger.info({ reviewId, field: review.canonicalName }, 'Review rejected');
  return review;
}

/**
 * Mark a field as unverified without rejecting.
 */
export async function markUnverified(
  reviewId: string,
  reviewedBy: string,
  reviewNote?: string,
): Promise<IReviewDocument> {
  const review = await Review.findById(reviewId);
  if (!review) throw new Error(`Review ${reviewId} not found`);

  if (review.canonicalName) {
    await ExtractedField.updateMany(
      { productId: review.productId, canonicalName: review.canonicalName },
      { $set: { status: 'UNVERIFIED', reviewId: review._id } },
    );
  }

  review.status = 'EDITED';
  review.action = 'MARK_UNVERIFIED';
  review.reviewedBy = reviewedBy;
  review.reviewNote = reviewNote;
  review.reviewedAt = new Date();
  await review.save();

  return review;
}

/**
 * Update product status based on remaining pending reviews.
 * If no pending reviews remain → APPROVED. Otherwise → REVIEW_REQUIRED.
 * A field with no trustworthy value stays UNVERIFIED even if a review exists.
 */
async function updateProductStatusFromReviews(productId: string): Promise<void> {
  const pendingReviews = await Review.countDocuments({ productId, status: 'PENDING' });
  const unverifiedConflicts = await ExtractedField.countDocuments({
    productId,
    status: { $in: ['CONFLICT', 'REVIEW_REQUIRED'] },
  });

  const newStatus = pendingReviews > 0 || unverifiedConflicts > 0 ? 'REVIEW_REQUIRED' : 'APPROVED';
  await Product.findByIdAndUpdate(productId, { status: newStatus });
}
