import { normalizeField, normalizeFieldName } from '../src/services/normalization/normalizationService';

describe('normalizationService', () => {
  describe('normalizeFieldName', () => {
    it('maps known aliases to canonical names', () => {
      expect(normalizeFieldName('max pressure')).toBe('maximumPressure');
      expect(normalizeFieldName('Maximum Pressure')).toBe('maximumPressure');
      expect(normalizeFieldName('bore diameter')).toBe('boreDiameter');
      expect(normalizeFieldName('operating temperature')).toBe('operatingTemperature');
      expect(normalizeFieldName('weight')).toBe('weight');
      expect(normalizeFieldName('part number')).toBe('partNumber');
    });

    it('converts unknown names to camelCase', () => {
      expect(normalizeFieldName('some Custom Field')).toBe('someCustomField');
    });
  });

  describe('normalizeField — pressure', () => {
    it('converts psi to bar', () => {
      const result = normalizeField('maximumPressure', 145.04, 'psi');
      expect(result.normalizedUnit).toBe('bar');
      expect(result.conversionApplied).toBe(true);
      expect(result.normalizedValue).toBeCloseTo(10, 1);
    });

    it('converts kPa to bar', () => {
      const result = normalizeField('maximumPressure', 21000, 'kPa');
      expect(result.normalizedUnit).toBe('bar');
      expect(result.normalizedValue).toBeCloseTo(210, 1);
    });

    it('210 bar and 21000 kPa normalize to same value', () => {
      const barResult = normalizeField('maximumPressure', 210, 'bar');
      const kpaResult = normalizeField('maximumPressure', 21000, 'kPa');
      expect(barResult.normalizedValue).toBeCloseTo(kpaResult.normalizedValue as number, 2);
    });

    it('preserves original value and unit', () => {
      const result = normalizeField('maximumPressure', 210, 'bar');
      expect(result.originalValue).toBe(210);
      expect(result.originalUnit).toBe('bar');
    });
  });

  describe('normalizeField — length', () => {
    it('converts inches to mm', () => {
      const result = normalizeField('boreDiameter', 4, 'in');
      expect(result.normalizedUnit).toBe('mm');
      expect(result.normalizedValue).toBeCloseTo(101.6, 1);
    });

    it('converts cm to mm', () => {
      const result = normalizeField('stroke', 25, 'cm');
      expect(result.normalizedUnit).toBe('mm');
      expect(result.normalizedValue).toBe(250);
    });
  });

  describe('normalizeField — mass', () => {
    it('converts lbs to kg', () => {
      const result = normalizeField('weight', 10, 'lbs');
      expect(result.normalizedUnit).toBe('kg');
      expect(result.normalizedValue).toBeCloseTo(4.536, 2);
    });
  });

  describe('normalizeField — temperature', () => {
    it('converts Fahrenheit to Celsius', () => {
      const result = normalizeField('maximumTemperature', 212, '°F');
      expect(result.normalizedUnit).toBe('°C');
      expect(result.normalizedValue).toBeCloseTo(100, 1);
    });

    it('converts Kelvin to Celsius', () => {
      const result = normalizeField('maximumTemperature', 373.15, 'K');
      expect(result.normalizedUnit).toBe('°C');
      expect(result.normalizedValue).toBeCloseTo(100, 1);
    });
  });

  describe('normalizeField — no conversion', () => {
    it('returns unchanged for string values', () => {
      const result = normalizeField('material', 'stainless steel');
      expect(result.normalizedValue).toBe('stainless steel');
      expect(result.conversionApplied).toBe(false);
    });

    it('returns unchanged if no unit provided', () => {
      const result = normalizeField('maximumPressure', 210);
      expect(result.conversionApplied).toBe(false);
    });
  });
});
