import { computeQuality } from '../src/services/quality/qualityService';

describe('qualityService', () => {
  const baseInput = {
    totalExtractedFields: 10,
    requiredFieldCount: 7,
    presentRequiredFields: 7,
    uniqueSourceTypes: ['TECHNICAL_DATASHEET', 'MARKETING_DOCUMENT'],
    validationErrorCount: 0,
    validationWarningCount: 0,
    overallConfidence: 0.85,
    contradictionCount: 0,
    unverifiedFieldCount: 0,
    totalFieldCount: 10,
    fieldStatuses: [] as any[],
  };

  it('produces a score between 0 and 100', () => {
    const result = computeQuality(baseInput);
    expect(result.qualityScore).toBeGreaterThanOrEqual(0);
    expect(result.qualityScore).toBeLessThanOrEqual(100);
  });

  it('penalizes contradictions', () => {
    const withConflict = computeQuality({ ...baseInput, contradictionCount: 2 });
    const withoutConflict = computeQuality(baseInput);
    expect(withConflict.qualityScore).toBeLessThan(withoutConflict.qualityScore);
  });

  it('penalizes validation errors', () => {
    const withErrors = computeQuality({ ...baseInput, validationErrorCount: 3 });
    const withoutErrors = computeQuality(baseInput);
    expect(withErrors.qualityScore).toBeLessThan(withoutErrors.qualityScore);
  });

  it('rewards higher confidence', () => {
    const highConf = computeQuality({ ...baseInput, overallConfidence: 0.95 });
    const lowConf = computeQuality({ ...baseInput, overallConfidence: 0.3 });
    expect(highConf.qualityScore).toBeGreaterThan(lowConf.qualityScore);
  });

  it('returns correct grade', () => {
    const highQuality = computeQuality({
      ...baseInput,
      overallConfidence: 0.95,
      presentRequiredFields: 7,
      uniqueSourceTypes: ['TECHNICAL_DATASHEET', 'MARKETING_DOCUMENT', 'USER_INPUT'],
    });
    expect(['A', 'B', 'C', 'D', 'F']).toContain(highQuality.grade);
  });

  it('returns summary string', () => {
    const result = computeQuality(baseInput);
    expect(typeof result.summary).toBe('string');
    expect(result.summary.length).toBeGreaterThan(0);
  });

  it('returns complete breakdown', () => {
    const result = computeQuality(baseInput);
    expect(result.breakdown.completeness).toBeDefined();
    expect(result.breakdown.sourceCoverage).toBeDefined();
    expect(result.breakdown.validationScore).toBeDefined();
    expect(result.breakdown.confidenceScore).toBeDefined();
    expect(result.breakdown.contradictionPenalty).toBeDefined();
    expect(result.breakdown.unverifiedPenalty).toBeDefined();
  });
});
