/**
 * Quality Scoring Service — deterministic.
 *
 * Quality = f(completeness, source coverage, validation, confidence, contradictions, unverified fields)
 * Score range: 0–100
 */

import { QualityBreakdown } from '../../models/Product';
import { FieldStatus } from '../../models/Product';

export interface QualityInput {
  totalExtractedFields: number;
  requiredFieldCount: number;
  presentRequiredFields: number;
  uniqueSourceTypes: string[];
  validationErrorCount: number;
  validationWarningCount: number;
  overallConfidence: number;
  contradictionCount: number;
  unverifiedFieldCount: number;
  totalFieldCount: number;
  fieldStatuses: FieldStatus[];
}

export interface QualityResult {
  qualityScore: number;       // 0–100
  breakdown: QualityBreakdown;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  summary: string;
}

// ── Required fields for completeness scoring ──────────────────────────────────

export const REQUIRED_FIELDS_FOR_QUALITY = [
  'maximumPressure',
  'boreDiameter',
  'stroke',
  'weight',
  'material',
  'partNumber',
  'modelNumber',
];

export function computeQuality(input: QualityInput): QualityResult {
  // 1. Completeness (0–1): required fields present / total required
  const completeness = input.requiredFieldCount > 0
    ? clamp(input.presentRequiredFields / input.requiredFieldCount, 0, 1)
    : (input.totalExtractedFields > 0 ? 0.5 : 0);

  // 2. Source coverage (0–1): more source types = better
  const sourceCoverage = clamp(input.uniqueSourceTypes.length / 3, 0, 1); // max 3 types expected

  // 3. Validation score (0–1): no errors = 1.0
  const validationScore = input.totalFieldCount > 0
    ? clamp(1 - (input.validationErrorCount * 0.2 + input.validationWarningCount * 0.05), 0, 1)
    : 0.5;

  // 4. Confidence score (already 0–1)
  const confidenceScore = clamp(input.overallConfidence, 0, 1);

  // 5. Contradiction penalty (0–1)
  const contradictionPenalty = clamp(input.contradictionCount * 0.15, 0, 0.6);

  // 6. Unverified penalty (0–1)
  const unverifiedRatio = input.totalFieldCount > 0
    ? input.unverifiedFieldCount / input.totalFieldCount
    : 0;
  const unverifiedPenalty = clamp(unverifiedRatio * 0.3, 0, 0.3);

  const breakdown: QualityBreakdown = {
    completeness,
    sourceCoverage,
    validationScore,
    confidenceScore,
    contradictionPenalty,
    unverifiedPenalty,
  };

  // Weighted aggregate
  const rawScore =
    completeness * 0.25 +
    sourceCoverage * 0.15 +
    validationScore * 0.20 +
    confidenceScore * 0.25 -
    contradictionPenalty -
    unverifiedPenalty;

  const qualityScore = Math.round(clamp(rawScore, 0, 1) * 100);

  return {
    qualityScore,
    breakdown,
    grade: scoreToGrade(qualityScore),
    summary: buildSummary(qualityScore, input),
  };
}

function scoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

function buildSummary(score: number, input: QualityInput): string {
  const issues: string[] = [];
  if (input.contradictionCount > 0) issues.push(`${input.contradictionCount} conflict(s) requiring review`);
  if (input.validationErrorCount > 0) issues.push(`${input.validationErrorCount} validation error(s)`);
  if (input.unverifiedFieldCount > 0) issues.push(`${input.unverifiedFieldCount} unverified field(s)`);
  const issueText = issues.length > 0 ? ` Issues: ${issues.join('; ')}.` : '';
  return `Quality score: ${score}/100.${issueText}`;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
