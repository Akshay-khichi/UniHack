export type AttributeStatus =
  | "FACT"
  | "AI_INFERENCE"
  | "UNVERIFIED"
  | "CONFLICT"
  | "VALIDATED";

export type ReviewState = "VERIFIED" | "REVIEW_REQUIRED" | "APPROVED" | "REJECTED";

export type ProductStatus = "READY" | "REVIEW_REQUIRED" | "CONFLICT" | "PROCESSING" | "DRAFT";

export type SourceType = "PDF" | "IMAGE" | "CSV" | "URL";

export interface ProductSource {
  id: string;
  name: string;
  type: SourceType;
  size?: string | undefined;
  url?: string | undefined;
  status: "Ready" | "Processing" | "Failed";
  ingestedAt: string;
  rawFile?: File | undefined;
}

export interface Evidence {
  sourceId: string;
  sourceName: string;
  sourceType: SourceType;
  page?: number | undefined;
  excerpt: string;
  extractedAt: string;
  value?: string | undefined;
}

export interface ProductAttribute {
  id: string;
  name: string;
  group: string;
  value: string;
  status: AttributeStatus;
  confidence: number;
  reviewState: ReviewState;
  reasoning?: string | undefined;
  evidence: Evidence[];
}

export interface QualityBreakdown {
  completeness: number;
  sourceCoverage: number;
  validation: number;
  confidence: number;
  contradictions: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  brand: string;
  category: string;
  description: string;
  applications: string[];
  features: string[];
  status: ProductStatus;
  qualityScore: number;
  confidence: number;
  attributesTotal: number;
  updatedAt: string;
  quality: QualityBreakdown;
  attributes: ProductAttribute[];
  sources: ProductSource[];
}

export type ReviewReasonType =
  | "CONFLICT"
  | "LOW_CONFIDENCE"
  | "UNVERIFIED"
  | "VALIDATION_ERROR";

export type ReviewPriority = "High" | "Medium" | "Low";

export interface ReviewItem {
  id: string;
  productId: string;
  productSku: string;
  productName: string;
  attributeId: string;
  attributeName: string;
  currentValue: string;
  reason: string;
  type: ReviewReasonType;
  confidence: number;
  priority: ReviewPriority;
  resolved: boolean;
  resolution?: string | undefined;
  note?: string | undefined;
}

export interface ReviewActivity {
  id: string;
  title: string;
  detail: string;
  kind: "approved" | "unverified" | "conflict" | "updated";
  at: string;
}

export interface ProductDraft {
  name: string;
  sku: string;
  brand: string;
  category: string;
  description: string;
}
