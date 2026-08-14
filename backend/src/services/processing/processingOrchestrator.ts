/**
 * Processing Orchestrator — Phase 12
 *
 * Full pipeline: INGEST → EXTRACT → NORMALIZE → VERIFY → VALIDATE
 *               → CONTRADICT → CONFIDENCE → QUALITY → ENRICH → FINALIZE
 *
 * Status precedence: CONFLICT → UNVERIFIED → REVIEW_REQUIRED → AI_INFERENCE → FACT
 * For conflicts: preserve BOTH values, preserve BOTH sources, create review, never auto-select.
 */

import { Product } from '../../models/Product';
import { ProductDocument, IDocumentDocument } from '../../models/Document';
import { Evidence } from '../../models/Evidence';
import { ExtractedField } from '../../models/ExtractedField';
import { Review } from '../../models/Review';
import { extractFromDocument } from '../extraction/extractionService';
import { normalizeField } from '../normalization/normalizationService';
import { validateFields } from '../validation/validationService';
import { verifyEvidence } from '../verification/verificationService';
import { detectContradictions, EvidenceObservation } from '../contradiction/contradictionService';
import { computeFieldConfidence } from '../confidence/confidenceService';
import { computeQuality } from '../quality/qualityService';
import { enrichProduct } from '../enrichment/enrichmentService';
import { createProductVersion } from '../review/versioningService';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';
import { FieldStatus } from '../../models/Product';

export interface ProcessingResult {
  productId: string;
  status: string;
  fieldsExtracted: number;
  conflicts: number;
  qualityScore: number;
  overallConfidence: number;
  reviewsRequired: number;
  processingTimeMs: number;
  warnings: string[];
}

/**
 * Determine the final status for a field based on precedence rules.
 * CONFLICT → UNVERIFIED → REVIEW_REQUIRED → AI_INFERENCE → FACT
 */
function determineFieldStatus(params: {
  hasConflict: boolean;
  verificationStatus: string;
  validationErrors: number;
  isAiInference: boolean;
}): FieldStatus {
  if (params.hasConflict) return 'CONFLICT';
  if (params.verificationStatus === 'CONTRADICTED') return 'UNVERIFIED';
  if (params.validationErrors > 0) return 'REVIEW_REQUIRED';
  if (params.verificationStatus === 'UNVERIFIED' || params.verificationStatus === 'PENDING') {
    return params.isAiInference ? 'AI_INFERENCE' : 'UNVERIFIED';
  }
  if (params.isAiInference) return 'AI_INFERENCE';
  return 'FACT';
}

export async function processProduct(productId: string): Promise<ProcessingResult> {
  const start = Date.now();
  const warnings: string[] = [];

  // ── 1. Load product ───────────────────────────────────────────────────────
  const product = await Product.findById(productId);
  if (!product) throw AppError.notFound('Product');

  await Product.findByIdAndUpdate(productId, { status: 'PROCESSING' });

  // ── 2. Load documents ─────────────────────────────────────────────────────
  const documents = (await ProductDocument.find({ productId }).lean()) as unknown as IDocumentDocument[];
  if (documents.length === 0) {
    warnings.push('No documents found — nothing to process');
    await Product.findByIdAndUpdate(productId, { status: 'DRAFT' });
    return {
      productId,
      status: 'DRAFT',
      fieldsExtracted: 0,
      conflicts: 0,
      qualityScore: 0,
      overallConfidence: 0,
      reviewsRequired: 0,
      processingTimeMs: Date.now() - start,
      warnings,
    };
  }

  // ── 3. Clear previous results ─────────────────────────────────────────────
  await Promise.all([
    Evidence.deleteMany({ productId }),
    ExtractedField.deleteMany({ productId }),
    Review.deleteMany({ productId, status: 'PENDING' }),
  ]);

  // ── 4. Extract from each document ─────────────────────────────────────────
  const allObservations: EvidenceObservation[] = [];
  const evidenceRecords: Array<{
    obs: EvidenceObservation;
    verificationStatus: string;
    verificationConfidence: number;
    verificationReasoning: string;
    extractionConfidence: number;
    isAiInference: boolean;
  }> = [];

  for (const doc of documents) {
    if (!doc.url) continue;

    // Fetch document content
    let content = '';
    try {
      const response = await fetch(doc.url, { signal: AbortSignal.timeout(15000) });
      if (doc.mimeType === 'application/json') {
        content = await response.text();
      } else if (doc.mimeType === 'text/csv') {
        content = await response.text();
      } else {
        // PDF/image: use URL as content reference — Gemini handles URL-referenced files
        content = `[Document: ${doc.name}, URL: ${doc.url}, Type: ${doc.mimeType}]`;
      }
    } catch (err) {
      warnings.push(`Could not fetch document ${doc.name}: ${(err as Error).message}`);
      content = `[Document: ${doc.name}, Type: ${doc.mimeType}]`;
    }

    // Extract
    let extractionResult;
    try {
      extractionResult = await extractFromDocument({
        content,
        filename: doc.name,
        mimeType: doc.mimeType,
        sourceType: doc.sourceType,
        productContext: {
          sku: product.sku,
          name: product.name,
          category: product.category,
        },
      });
    } catch (err) {
      warnings.push(`Extraction failed for ${doc.name}: ${(err as Error).message}`);
      await ProductDocument.findByIdAndUpdate(doc._id, {
        processingStatus: 'FAILED',
        processingError: (err as Error).message,
      });
      continue;
    }

    warnings.push(...extractionResult.warnings);

    // ── 5. Normalize + Verify each field ─────────────────────────────────────
    for (const rawField of extractionResult.fields) {
      const normalized = normalizeField(rawField.fieldName, rawField.value, rawField.unit);

      // Verify against excerpt
      const verification = await verifyEvidence({
        claim: {
          fieldName: rawField.fieldName,
          value: rawField.value,
          unit: rawField.unit,
        },
        sourceExcerpt: rawField.excerpt || '',
        documentSourceType: doc.sourceType,
      });

      const obs: EvidenceObservation = {
        id: `${String(doc._id)}-${rawField.canonicalName}`,
        documentId: String(doc._id),
        canonicalName: normalized.canonicalName,
        value: normalized.normalizedValue,
        unit: normalized.normalizedUnit,
        sourceType: doc.sourceType,
        excerpt: rawField.excerpt,
        pageNumber: rawField.pageNumber,
      };

      allObservations.push(obs);

      // Save evidence record
      await Evidence.create({
        productId,
        documentId: doc._id,
        fieldName: rawField.fieldName,
        canonicalName: normalized.canonicalName,
        value: normalized.normalizedValue,
        unit: normalized.normalizedUnit,
        sourceType: doc.sourceType,
        pageNumber: rawField.pageNumber,
        excerpt: rawField.excerpt,
        verificationStatus: verification.status,
        verificationConfidence: verification.confidence,
        verificationReasoning: verification.reasoning,
        extractionConfidence: rawField.confidence,
      });

      evidenceRecords.push({
        obs,
        verificationStatus: verification.status,
        verificationConfidence: verification.confidence,
        verificationReasoning: verification.reasoning,
        extractionConfidence: rawField.confidence,
        isAiInference: false,
      });
    }

    await ProductDocument.findByIdAndUpdate(doc._id, {
      processingStatus: 'COMPLETED',
      extractedAt: new Date(),
    });
  }

  // ── 6. Validate all fields ────────────────────────────────────────────────
  const fieldsForValidation = allObservations.map((o) => ({
    canonicalName: o.canonicalName,
    value: o.value,
    unit: o.unit,
  }));
  const validationResult = validateFields(fieldsForValidation);

  const validationErrorMap = new Map<string, Array<{ code: string; message: string }>>();
  for (const err of validationResult.errors) {
    const existing = validationErrorMap.get(err.field) || [];
    existing.push({ code: err.code, message: err.message });
    validationErrorMap.set(err.field, existing);
  }

  // ── 7. Detect contradictions ──────────────────────────────────────────────
  const contradictionReport = detectContradictions(allObservations);

  // ── 8. Build contradiction lookup ─────────────────────────────────────────
  const contradictionMap = new Map(
    contradictionReport.groups.map((g) => [g.canonicalName, g]),
  );

  // ── 9. Compute confidence ─────────────────────────────────────────────────
  const evidencesForConfidence = evidenceRecords.map((r) => ({
    canonicalName: r.obs.canonicalName,
    verificationStatus: r.verificationStatus as 'VERIFIED' | 'UNVERIFIED' | 'CONTRADICTED' | 'PENDING',
    verificationConfidence: r.verificationConfidence,
    extractionConfidence: r.extractionConfidence,
    sourceType: r.obs.sourceType,
  }));

  const confidenceResult = computeFieldConfidence(
    evidencesForConfidence,
    contradictionReport.groups.map((g) => ({ canonicalName: g.canonicalName, status: g.status })),
    validationResult.errors,
  );

  const confidenceMap = new Map(confidenceResult.perField.map((f) => [f.canonicalName, f.confidence]));

  // ── 10. Persist ExtractedFields ───────────────────────────────────────────
  // Group observations by canonical name
  const byCanonical = new Map<string, typeof evidenceRecords>();
  for (const rec of evidenceRecords) {
    const existing = byCanonical.get(rec.obs.canonicalName) || [];
    existing.push(rec);
    byCanonical.set(rec.obs.canonicalName, existing);
  }

  let reviewsRequired = 0;

  for (const [canonicalName, recs] of byCanonical.entries()) {
    const contradictionGroup = contradictionMap.get(canonicalName);
    const hasConflict = contradictionGroup?.status === 'CONFLICT';
    const validationErrors = validationErrorMap.get(canonicalName) || [];
    const confidence = confidenceMap.get(canonicalName) ?? 0;

    // Primary record: first observation (best extraction confidence)
    const primary = recs.sort((a, b) => b.extractionConfidence - a.extractionConfidence)[0];

    const status = determineFieldStatus({
      hasConflict,
      verificationStatus: primary.verificationStatus,
      validationErrors: validationErrors.length,
      isAiInference: primary.isAiInference,
    });

    // For conflicts: preserve all contradicting values
    const contradictingValues = hasConflict
      ? recs
          .filter((r) => r !== primary)
          .map((r) => ({
            value: r.obs.value,
            unit: r.obs.unit,
            sourceType: r.obs.sourceType,
            documentId: r.obs.documentId,
            excerpt: r.obs.excerpt,
          }))
      : [];

    await ExtractedField.create({
      productId,
      documentId: primary.obs.documentId,
      fieldName: canonicalName,
      canonicalName,
      value: primary.obs.value,
      unit: primary.obs.unit,
      originalValue: primary.obs.value,
      originalUnit: primary.obs.unit,
      status,
      confidence,
      sourceType: primary.obs.sourceType,
      pageNumber: primary.obs.pageNumber,
      excerpt: primary.obs.excerpt,
      contradictionGroupId: contradictionGroup?.contradictionGroupId,
      contradictingValues,
      validationErrors,
    });

    // Create review record for conflicts and review-required fields
    if (status === 'CONFLICT' || status === 'REVIEW_REQUIRED') {
      await Review.create({
        productId,
        fieldName: canonicalName,
        canonicalName,
        contradictionGroupId: contradictionGroup?.contradictionGroupId,
        status: 'PENDING',
        originalValue: primary.obs.value,
        originalUnit: primary.obs.unit,
      });
      reviewsRequired++;
    }
  }

  // ── 11. RAG Enrichment ────────────────────────────────────────────────────
  if (product.category) {
    const existingFieldNames = [...byCanonical.keys()];
    const enrichmentResult = await enrichProduct(product.category, existingFieldNames);

    for (const enriched of enrichmentResult.enrichedFields) {
      if (!enriched.suggestedValue) continue;

      await ExtractedField.create({
        productId,
        fieldName: enriched.canonicalName,
        canonicalName: enriched.canonicalName,
        value: enriched.suggestedValue,
        unit: enriched.unit || undefined,
        originalValue: enriched.suggestedValue,
        originalUnit: enriched.unit || undefined,
        status: enriched.status, // AI_INFERENCE or UNVERIFIED — never FACT
        confidence: enriched.confidence,
        sourceType: 'AI_GENERATED',
      });
    }

    if (enrichmentResult.enrichedFields.length > 0) {
      logger.info(
        { productId, enriched: enrichmentResult.enrichedFields.length },
        'Enrichment complete',
      );
    }
  }

  // ── 12. Compute quality ───────────────────────────────────────────────────
  const allExtractedFields = await ExtractedField.find({ productId }).lean();
  const uniqueSourceTypes = [...new Set(allObservations.map((o) => o.sourceType))];

  const qualityInput = {
    totalExtractedFields: allExtractedFields.length,
    requiredFieldCount: 7,
    presentRequiredFields: allExtractedFields.filter((f) =>
      ['maximumPressure', 'boreDiameter', 'stroke', 'weight', 'material', 'partNumber', 'modelNumber']
        .includes(f.canonicalName),
    ).length,
    uniqueSourceTypes,
    validationErrorCount: validationResult.errors.length,
    validationWarningCount: validationResult.warnings.length,
    overallConfidence: confidenceResult.overall,
    contradictionCount: contradictionReport.conflictCount,
    unverifiedFieldCount: allExtractedFields.filter((f) => f.status === 'UNVERIFIED').length,
    totalFieldCount: allExtractedFields.length,
    fieldStatuses: allExtractedFields.map((f) => f.status as FieldStatus),
  };

  const qualityResult = computeQuality(qualityInput);

  // ── 13. Update product ────────────────────────────────────────────────────
  const finalStatus = reviewsRequired > 0 || contradictionReport.hasConflicts
    ? 'REVIEW_REQUIRED'
    : 'APPROVED';

  await Product.findByIdAndUpdate(productId, {
    status: finalStatus,
    qualityScore: qualityResult.qualityScore,
    qualityBreakdown: qualityResult.breakdown,
    overallConfidence: confidenceResult.overall,
  });

  // ── 14. Create version snapshot ───────────────────────────────────────────
  await createProductVersion(productId, 'system', 'Automated processing pipeline');

  const processingTimeMs = Date.now() - start;
  logger.info(
    { productId, fieldsExtracted: byCanonical.size, conflicts: contradictionReport.conflictCount, processingTimeMs },
    'Processing complete',
  );

  return {
    productId,
    status: finalStatus,
    fieldsExtracted: byCanonical.size,
    conflicts: contradictionReport.conflictCount,
    qualityScore: qualityResult.qualityScore,
    overallConfidence: confidenceResult.overall,
    reviewsRequired,
    processingTimeMs,
    warnings,
  };
}
