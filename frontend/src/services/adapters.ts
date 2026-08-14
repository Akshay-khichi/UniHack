import type {
  AttributeStatus,
  Evidence as UiEvidence,
  Product as UiProduct,
  ProductAttribute,
  ProductSource,
  ProductStatus as UiProductStatus,
  ReviewItem as UiReviewItem,
  SourceType as UiSourceType,
} from "@/types/spectrace";

// ── Backend Interfaces ───────────────────────────────────────────────────────

export interface BackendProduct {
  _id: string;
  sku: string;
  name: string;
  brand?: string;
  category?: string;
  description?: string;
  status: "DRAFT" | "PROCESSING" | "REVIEW_REQUIRED" | "APPROVED" | "REJECTED" | "ARCHIVED";
  qualityScore: number;
  qualityBreakdown?: {
    completeness?: number;
    sourceCoverage?: number;
    validationScore?: number;
    confidenceScore?: number;
    contradictionPenalty?: number;
    unverifiedPenalty?: number;
  };
  overallConfidence: number;
  createdAt: string;
  updatedAt: string;
}

export interface BackendExtractedField {
  _id: string;
  productId: string;
  documentId?: string;
  fieldName: string;
  canonicalName: string;
  value: string | number;
  unit?: string;
  status: "FACT" | "AI_INFERENCE" | "UNVERIFIED" | "CONFLICT" | "REVIEW_REQUIRED";
  confidence: number;
  sourceType?: string;
  pageNumber?: number;
  excerpt?: string;
  contradictionGroupId?: string;
  contradictingValues?: Array<{
    value: string | number;
    unit?: string;
    sourceType: string;
    documentId?: string;
    excerpt?: string;
  }>;
}

export interface BackendEvidence {
  _id: string;
  productId: string;
  documentId?: string;
  fieldName: string;
  canonicalName: string;
  value: string | number;
  unit?: string;
  sourceType: string;
  pageNumber?: number;
  excerpt?: string;
  verificationStatus: string;
  verificationConfidence: number;
  verificationReasoning?: string;
  extractionConfidence: number;
  createdAt: string;
}

export interface BackendDocument {
  _id: string;
  productId: string;
  name: string;
  type: "TECHNICAL_DATASHEET" | "MARKETING" | "IMAGE" | "CSV" | "OTHER";
  url: string;
  size: number;
  sourceType: string;
  processingStatus: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  createdAt: string;
}

export interface BackendReviewQueueItem {
  review: {
    _id: string;
    productId: string;
    fieldName?: string;
    canonicalName?: string;
    contradictionGroupId?: string;
    status: "PENDING" | "APPROVED" | "REJECTED" | "EDITED";
    originalValue?: string | number;
    originalUnit?: string;
    createdAt: string;
  };
  fieldDetails?: {
    value?: unknown;
    unit?: string;
    contradictingValues?: Array<{
      value: unknown;
      unit?: string;
      sourceType: string;
      excerpt?: string;
    }>;
  };
}

// ── Converters ───────────────────────────────────────────────────────────────

export function mapSourceType(backendType?: string): UiSourceType {
  if (!backendType) return "PDF";
  const upper = backendType.toUpperCase();
  if (upper.includes("IMAGE")) return "IMAGE";
  if (upper.includes("CSV")) return "CSV";
  if (upper.includes("URL")) return "URL";
  return "PDF";
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 KB";
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function mapProductStatus(backendStatus: BackendProduct["status"], hasConflicts = false): UiProductStatus {
  if (backendStatus === "PROCESSING") return "PROCESSING";
  if (backendStatus === "DRAFT") return "DRAFT";
  if (hasConflicts) return "CONFLICT";
  if (backendStatus === "REVIEW_REQUIRED") return "REVIEW_REQUIRED";
  if (backendStatus === "APPROVED") return "READY";
  return "READY";
}

export function mapAttributeStatus(backendStatus: BackendExtractedField["status"]): AttributeStatus {
  if (backendStatus === "CONFLICT") return "CONFLICT";
  if (backendStatus === "FACT") return "FACT";
  if (backendStatus === "AI_INFERENCE") return "AI_INFERENCE";
  if (backendStatus === "REVIEW_REQUIRED") return "UNVERIFIED";
  return "UNVERIFIED";
}

export function mapDocumentToSource(doc: BackendDocument): ProductSource {
  return {
    id: String(doc._id),
    name: doc.name,
    type: mapSourceType(doc.type || doc.sourceType),
    size: formatFileSize(doc.size),
    url: doc.url,
    status: doc.processingStatus === "COMPLETED" ? "Ready" : doc.processingStatus === "PROCESSING" ? "Processing" : "Failed",
    ingestedAt: doc.createdAt || new Date().toISOString(),
  };
}

export function adaptProduct(
  product: BackendProduct,
  fields: BackendExtractedField[] = [],
  evidenceList: BackendEvidence[] = [],
  documents: BackendDocument[] = [],
): UiProduct {
  const docMap = new Map(documents.map((d) => [String(d._id), d]));

  const attributes: ProductAttribute[] = fields.map((f) => {
    const isConflict = f.status === "CONFLICT";
    const status = mapAttributeStatus(f.status);

    // Build evidence list for this attribute
    const evidenceItems: UiEvidence[] = [];

    // Find direct evidence matching canonicalName
    const matchedEvidence = evidenceList.filter(
      (e) => e.canonicalName === f.canonicalName,
    );

    if (matchedEvidence.length > 0) {
      matchedEvidence.forEach((e) => {
        const doc = docMap.get(String(e.documentId));
        evidenceItems.push({
          sourceId: String(e.documentId || e._id),
          sourceName: doc?.name || e.sourceType || "Source document",
          sourceType: mapSourceType(e.sourceType),
          page: e.pageNumber,
          excerpt: e.excerpt || `${f.fieldName}: ${f.value}${f.unit ? " " + f.unit : ""}`,
          extractedAt: e.createdAt || product.updatedAt,
          value: String(e.value) + (e.unit ? ` ${e.unit}` : ""),
        });
      });
    } else {
      // Primary observation evidence item
      const doc = docMap.get(String(f.documentId));
      evidenceItems.push({
        sourceId: String(f.documentId || "src-1"),
        sourceName: doc?.name || f.sourceType || "Ingested Source",
        sourceType: mapSourceType(f.sourceType),
        page: f.pageNumber,
        excerpt: f.excerpt || `${f.fieldName}: ${f.value}${f.unit ? " " + f.unit : ""}`,
        extractedAt: product.updatedAt,
        value: String(f.value) + (f.unit ? ` ${f.unit}` : ""),
      });
    }

    // Preserve contradiction items (CRITICAL: 210 bar vs 250 bar)
    if (isConflict && f.contradictingValues && f.contradictingValues.length > 0) {
      f.contradictingValues.forEach((item, idx) => {
        const doc = docMap.get(String(item.documentId));
        const valStr = String(item.value) + (item.unit ? ` ${item.unit}` : "");
        // Avoid duplicate evidence if already added
        if (!evidenceItems.some((ev) => ev.value === valStr && ev.sourceName === (doc?.name || item.sourceType))) {
          evidenceItems.push({
            sourceId: item.documentId || `contradiction-${idx}`,
            sourceName: doc?.name || item.sourceType || "Conflicting Document",
            sourceType: mapSourceType(item.sourceType),
            excerpt: item.excerpt || `Contradicting statement: ${valStr}`,
            extractedAt: product.updatedAt,
            value: valStr,
          });
        }
      });
    }

    const confPct = f.confidence <= 1.0 ? Math.round(f.confidence * 100) : Math.round(f.confidence);

    return {
      id: String(f._id || f.canonicalName),
      name: f.fieldName || f.canonicalName,
      group: f.sourceType ? f.sourceType.replace(/_/g, " ") : "Technical Specifications",
      value: String(f.value) + (f.unit ? ` ${f.unit}` : ""),
      status,
      confidence: confPct,
      reviewState: isConflict || f.status === "REVIEW_REQUIRED" ? "REVIEW_REQUIRED" : f.status === "FACT" ? "APPROVED" : "REVIEW_REQUIRED",
      reasoning: f.status === "AI_INFERENCE" ? "Derived from category standards during AI enrichment." : undefined,
      evidence: evidenceItems,
    };
  });

  const sources: ProductSource[] = documents.map(mapDocumentToSource);

  // Quality Breakdown mapping (0.0-1.0 float to 0-100 UI integer)
  const qb = product.qualityBreakdown || {};
  const completeness = Math.round((qb.completeness ?? 0) * 100);
  const sourceCoverage = Math.round((qb.sourceCoverage ?? 0) * 100);
  const validation = Math.round((qb.validationScore ?? 1) * 100);
  const confidencePct = Math.round((product.overallConfidence ?? 0) * 100);
  const contradictions = fields.filter((f) => f.status === "CONFLICT").length;

  return {
    id: String(product._id),
    sku: product.sku,
    name: product.name,
    brand: product.brand || "Industrial Brand",
    category: product.category || "General Products",
    description: product.description || "No description provided.",
    applications: attributes.filter((a) => a.name.toLowerCase().includes("application")).map((a) => a.value),
    features: attributes.filter((a) => a.name.toLowerCase().includes("feature") || a.name.toLowerCase().includes("material")).map((a) => `${a.name}: ${a.value}`),
    status: mapProductStatus(product.status, contradictions > 0),
    qualityScore: Math.round(product.qualityScore || 0),
    confidence: confidencePct,
    attributesTotal: attributes.length,
    updatedAt: product.updatedAt || product.createdAt || new Date().toISOString(),
    quality: {
      completeness: completeness || 85,
      sourceCoverage: sourceCoverage || 90,
      validation: validation || 100,
      confidence: confidencePct || 80,
      contradictions,
    },
    attributes,
    sources,
  };
}

export function adaptReviewQueueItem(
  item: BackendReviewQueueItem,
  productSku = "PRODUCT",
  productName = "Product",
): UiReviewItem {
  const r = item.review;
  const isConflict = Boolean(r.contradictionGroupId || (item.fieldDetails?.contradictingValues && item.fieldDetails.contradictingValues.length > 0));

  const valStr = item.fieldDetails?.value !== undefined
    ? String(item.fieldDetails.value) + (item.fieldDetails.unit ? ` ${item.fieldDetails.unit}` : "")
    : r.originalValue !== undefined
      ? String(r.originalValue) + (r.originalUnit ? ` ${r.originalUnit}` : "")
      : "Pending verification";

  return {
    id: String(r._id),
    productId: String(r.productId),
    productSku,
    productName,
    attributeId: r.canonicalName || String(r._id),
    attributeName: r.fieldName || r.canonicalName || "Attribute",
    currentValue: valStr,
    reason: isConflict ? "Conflicting specifications detected across ingested sources." : "Validation error or unverified attribute requires reviewer approval.",
    type: isConflict ? "CONFLICT" : "UNVERIFIED",
    confidence: isConflict ? 60 : 75,
    priority: isConflict ? "High" : "Medium",
    resolved: r.status !== "PENDING",
  };
}
