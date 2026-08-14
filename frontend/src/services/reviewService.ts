import type { ReviewActivity, ReviewItem } from "@/types/spectrace";
import { apiGet, apiPost } from "./api";
import {
  adaptReviewQueueItem,
  type BackendProduct,
  type BackendReviewQueueItem,
} from "./adapters";

export type ReviewDecision = "approve" | "edit" | "reject" | "unverified";

export interface ResolveInput {
  reviewId: string;
  decision: ReviewDecision;
  value?: string;
  note?: string;
}

/**
 * Fetch pending review items across all products in the backend.
 * Uses GET /api/products -> GET /api/products/:productId/reviews/queue for each product.
 */
export async function listReviews(): Promise<ReviewItem[]> {
  try {
    const products = await apiGet<BackendProduct[]>("/products?limit=100");
    if (!Array.isArray(products) || products.length === 0) return [];

    const allItems: ReviewItem[] = [];

    // Fetch review queues in parallel for all products
    const queuePromises = products.map(async (product) => {
      try {
        const queue = await apiGet<BackendReviewQueueItem[]>(
          `/products/${product._id}/reviews/queue`,
        );
        if (Array.isArray(queue)) {
          return queue.map((q) =>
            adaptReviewQueueItem(q, product.sku, product.name),
          );
        }
      } catch (err) {
        console.warn(`Failed to fetch review queue for product ${product._id}:`, err);
      }
      return [];
    });

    const results = await Promise.all(queuePromises);
    results.forEach((items) => {
      allItems.push(...items);
    });

    return allItems;
  } catch (err) {
    console.error("Failed to list review queue:", err);
    throw err;
  }
}

/**
 * Resolve a review item by sending the exact review action to the backend.
 * Endpoints:
 *   approve     -> POST /api/products/reviews/:reviewId/approve
 *   edit        -> POST /api/products/reviews/:reviewId/edit
 *   reject      -> POST /api/products/reviews/:reviewId/reject
 *   unverified  -> POST /api/products/reviews/:reviewId/mark-unverified
 */
export async function resolveReviewApi({
  reviewId,
  decision,
  value,
  note,
}: ResolveInput): Promise<void> {
  const reviewedBy = "Human Reviewer";

  switch (decision) {
    case "approve":
      await apiPost(`/products/reviews/${reviewId}/approve`, {
        reviewedBy,
        reviewNote: note || "Approved by reviewer",
      });
      break;

    case "edit":
      await apiPost(`/products/reviews/${reviewId}/edit`, {
        editedValue: value || "",
        reviewedBy,
        reviewNote: note || "Edited by reviewer",
      });
      break;

    case "reject":
      await apiPost(`/products/reviews/${reviewId}/reject`, {
        reviewedBy,
        reviewNote: note || "Rejected by reviewer",
      });
      break;

    case "unverified":
      await apiPost(`/products/reviews/${reviewId}/mark-unverified`, {
        reviewedBy,
        reviewNote: note || "Marked unverified by reviewer",
      });
      break;

    default:
      throw new Error(`Unsupported review decision: ${decision}`);
  }
}

/**
 * Helper to fetch review activity history for dashboard.
 */
export async function fetchReviewActivity(): Promise<ReviewActivity[]> {
  try {
    const products = await apiGet<BackendProduct[]>("/products?limit=5");
    const activities: ReviewActivity[] = [];

    for (const p of products) {
      const versions = await apiGet<Array<{ _id: string; changeReason: string; createdAt: string }>>(
        `/products/${p._id}/versions`,
      ).catch(() => []);

      versions.forEach((v) => {
        activities.push({
          id: v._id,
          title: v.changeReason || "Product updated",
          detail: `${p.sku} · ${p.name}`,
          kind: v.changeReason.toLowerCase().includes("approved")
            ? "approved"
            : v.changeReason.toLowerCase().includes("edited")
              ? "updated"
              : "unverified",
          at: new Date(v.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
      });
    }

    return activities.slice(0, 10);
  } catch {
    return [];
  }
}
