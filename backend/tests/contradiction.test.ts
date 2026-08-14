import {
  detectContradictions,
  EvidenceObservation,
} from '../src/services/contradiction/contradictionService';

function makeObs(
  id: string,
  canonicalName: string,
  value: string | number,
  unit?: string,
  sourceType: string = 'TECHNICAL_DATASHEET',
): EvidenceObservation {
  return {
    id,
    documentId: `doc-${id}`,
    canonicalName,
    value,
    unit,
    sourceType,
    excerpt: `Excerpt for ${canonicalName}: ${value}`,
  };
}

describe('contradictionService', () => {
  describe('HC-5020 demo case', () => {
    it('detects CONFLICT: 210 bar (datasheet) vs 250 bar (marketing)', () => {
      const observations: EvidenceObservation[] = [
        { ...makeObs('1', 'maximumPressure', 210, 'bar', 'TECHNICAL_DATASHEET'), documentId: 'doc-technical' },
        { ...makeObs('2', 'maximumPressure', 250, 'bar', 'MARKETING_DOCUMENT'), documentId: 'doc-marketing' },
      ];

      const report = detectContradictions(observations);

      expect(report.hasConflicts).toBe(true);
      expect(report.conflictCount).toBe(1);
      expect(report.conflictFields).toContain('maximumPressure');

      const group = report.groups.find((g) => g.canonicalName === 'maximumPressure');
      expect(group?.status).toBe('CONFLICT');
      expect(group?.observations).toHaveLength(2); // both values preserved
      expect(group?.conflictingPairs).toHaveLength(1);
    });
  });

  describe('unit normalization — no false conflicts', () => {
    it('210 bar == 21,000 kPa → CONSISTENT', () => {
      const observations: EvidenceObservation[] = [
        makeObs('1', 'maximumPressure', 210, 'bar'),
        makeObs('2', 'maximumPressure', 21000, 'kPa'),
      ];
      const report = detectContradictions(observations);
      expect(report.hasConflicts).toBe(false);
      const group = report.groups.find((g) => g.canonicalName === 'maximumPressure');
      expect(group?.status).toBe('CONSISTENT');
    });

    it('4 in == 101.6 mm → CONSISTENT', () => {
      const observations: EvidenceObservation[] = [
        makeObs('1', 'boreDiameter', 4, 'in'),
        makeObs('2', 'boreDiameter', 101.6, 'mm'),
      ];
      const report = detectContradictions(observations);
      expect(report.hasConflicts).toBe(false);
    });
  });

  describe('string comparison', () => {
    it('same string (case insensitive) → CONSISTENT', () => {
      const observations: EvidenceObservation[] = [
        makeObs('1', 'material', 'Stainless Steel'),
        makeObs('2', 'material', 'stainless steel'),
      ];
      const report = detectContradictions(observations);
      expect(report.hasConflicts).toBe(false);
    });

    it('different strings → CONFLICT', () => {
      const observations: EvidenceObservation[] = [
        makeObs('1', 'material', 'Stainless Steel'),
        makeObs('2', 'material', 'Carbon Steel'),
      ];
      const report = detectContradictions(observations);
      expect(report.hasConflicts).toBe(true);
    });
  });

  describe('single source', () => {
    it('single observation → SINGLE_SOURCE', () => {
      const report = detectContradictions([makeObs('1', 'maximumPressure', 210, 'bar')]);
      expect(report.groups[0].status).toBe('SINGLE_SOURCE');
      expect(report.hasConflicts).toBe(false);
    });
  });

  describe('deterministic contradictionGroupId', () => {
    it('same inputs produce the same ID', () => {
      const obs = [
        makeObs('1', 'maximumPressure', 210, 'bar'),
        makeObs('2', 'maximumPressure', 250, 'bar'),
      ];
      const r1 = detectContradictions(obs);
      const r2 = detectContradictions(obs);
      expect(r1.groups[0].contradictionGroupId).toBe(r2.groups[0].contradictionGroupId);
    });
  });

  describe('never deletes values', () => {
    it('all observations preserved in conflict group', () => {
      const observations: EvidenceObservation[] = [
        makeObs('1', 'maximumPressure', 210, 'bar'),
        makeObs('2', 'maximumPressure', 250, 'bar'),
        makeObs('3', 'maximumPressure', 230, 'bar'),
      ];
      const report = detectContradictions(observations);
      const group = report.groups.find((g) => g.canonicalName === 'maximumPressure');
      expect(group?.observations).toHaveLength(3);
    });
  });
});
