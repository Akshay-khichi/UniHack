/**
 * Confidence Scoring Service : deterministic.
 *
 * Confidence = f(source support, document agreement, validation, contradictions)
 * All scores bounded [0, 1].
 */

import { ContradictionStatus } from '../contradiction/contradictionService';
import { VerificationStatus } from '../../models/Evidence';

export interface EvidenceForConfidence {
  canonicalName: string;
  verificationStatus: VerificationStatus;
  verificationConfidence: number;
  extractionConfidence: number;
  sourceType: string;
}

export interface ContradictionForConfidence {
  canonicalName: string;
  status: ContradictionStatus;
}

export interface ValidationErrorsForConfidence {
  field: string;
  code: string;
}

export interface FieldConfidence {
  canonicalName: string;
  confidence: number;
  factors: {
    extractionAvg: number;
    verificationBoost: number;
    contradictionPenalty: number;
    sourceWeight: number;
  };
}

export interface OverallConfidenceResult {
  overall: number;
  perField: FieldConfidence[];
}

// ── Source weights ────────────────────────────────────────────────────────────

const SOURCE_WEIGHTS: Record<string, number> = {
  TECHNICAL_DATASHEET: 1.0,
  MARKETING_DOCUMENT: 0.6,
  USER_INPUT: 0.8,
  AI_GENERATED: 0.4,
};

const VERIFICATION_BOOSTS: Record<VerificationStatus, number> = {
  VERIFIED: 0.15,
  UNVERIFIED: 0,
  PENDING: 0,
  CONTRADICTED: -0.2,
};

const CONTRADICTION_PENALTY = 0.4;

export function computeFieldConfidence(
  evidences: EvidenceForConfidence[],
  contradictions: ContradictionForConfidence[],
  validationErrors: ValidationErrorsForConfidence[],
): OverallConfidenceResult {
  const contradictionMap = new Map(contradictions.map((c) => [c.canonicalName, c.status]));
  const validationErrorFields = new Set(validationErrors.map((e) => e.field));

  // Group evidences by canonical name
  const byField = new Map<string, EvidenceForConfidence[]>();
  for (const ev of evidences) {
    const existing = byField.get(ev.canonicalName) || [];
    existing.push(ev);
    byField.set(ev.canonicalName, existing);
  }

  const perField: FieldConfidence[] = [];

  for (const [canonicalName, fieldEvidences] of byField.entries()) {
    const extractionAvg = avg(fieldEvidences.map((e) => e.extractionConfidence));
    const sourceWeight = avg(fieldEvidences.map((e) => SOURCE_WEIGHTS[e.sourceType] ?? 0.5));

    // Verification boost: average across evidence
    const verificationBoost = avg(
      fieldEvidences.map((e) => VERIFICATION_BOOSTS[e.verificationStatus] ?? 0),
    );

    // Contradiction penalty
    const contradictionStatus = contradictionMap.get(canonicalName);
    const contradictionPenalty = contradictionStatus === 'CONFLICT' ? CONTRADICTION_PENALTY : 0;

    // Validation penalty
    const validationPenalty = validationErrorFields.has(canonicalName) ? 0.2 : 0;

    let confidence = extractionAvg * sourceWeight + verificationBoost - contradictionPenalty - validationPenalty;
    confidence = clamp(confidence, 0, 1);

    perField.push({
      canonicalName,
      confidence,
      factors: { extractionAvg, verificationBoost, contradictionPenalty, sourceWeight },
    });
  }

  const overall = perField.length > 0 ? avg(perField.map((f) => f.confidence)) : 0;

  return { overall: clamp(overall, 0, 1), perField };
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
