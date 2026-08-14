import { computeFieldConfidence } from '../src/services/confidence/confidenceService';

describe('confidenceService', () => {
  it('returns 0 for empty evidence', () => {
    const result = computeFieldConfidence([], [], []);
    expect(result.overall).toBe(0);
    expect(result.perField).toHaveLength(0);
  });

  it('computes higher confidence for VERIFIED technical datasheet', () => {
    const result = computeFieldConfidence(
      [
        {
          canonicalName: 'maximumPressure',
          verificationStatus: 'VERIFIED',
          verificationConfidence: 0.95,
          extractionConfidence: 0.9,
          sourceType: 'TECHNICAL_DATASHEET',
        },
      ],
      [{ canonicalName: 'maximumPressure', status: 'SINGLE_SOURCE' }],
      [],
    );
    expect(result.overall).toBeGreaterThan(0.7);
  });

  it('reduces confidence for CONFLICT', () => {
    const withConflict = computeFieldConfidence(
      [
        {
          canonicalName: 'maximumPressure',
          verificationStatus: 'VERIFIED',
          verificationConfidence: 0.95,
          extractionConfidence: 0.9,
          sourceType: 'TECHNICAL_DATASHEET',
        },
      ],
      [{ canonicalName: 'maximumPressure', status: 'CONFLICT' }],
      [],
    );
    const withoutConflict = computeFieldConfidence(
      [
        {
          canonicalName: 'maximumPressure',
          verificationStatus: 'VERIFIED',
          verificationConfidence: 0.95,
          extractionConfidence: 0.9,
          sourceType: 'TECHNICAL_DATASHEET',
        },
      ],
      [{ canonicalName: 'maximumPressure', status: 'SINGLE_SOURCE' }],
      [],
    );
    expect(withConflict.overall).toBeLessThan(withoutConflict.overall);
  });

  it('scores are bounded [0, 1]', () => {
    const result = computeFieldConfidence(
      [
        {
          canonicalName: 'field',
          verificationStatus: 'CONTRADICTED',
          verificationConfidence: 0,
          extractionConfidence: 0,
          sourceType: 'AI_GENERATED',
        },
      ],
      [{ canonicalName: 'field', status: 'CONFLICT' }],
      [{ field: 'field', code: 'ERROR' }],
    );
    expect(result.overall).toBeGreaterThanOrEqual(0);
    expect(result.overall).toBeLessThanOrEqual(1);
  });
});
