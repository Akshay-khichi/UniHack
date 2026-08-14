import { validateFields, validateProductRequiredFields } from '../src/services/validation/validationService';

describe('validationService', () => {
  describe('validateFields', () => {
    it('passes valid fields', () => {
      const result = validateFields([
        { canonicalName: 'maximumPressure', value: 210, unit: 'bar' },
        { canonicalName: 'boreDiameter', value: 50, unit: 'mm' },
        { canonicalName: 'weight', value: 5, unit: 'kg' },
      ]);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('errors on boreDiameter <= 0', () => {
      const result = validateFields([{ canonicalName: 'boreDiameter', value: 0, unit: 'mm' }]);
      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe('INVALID_NON_POSITIVE');
    });

    it('errors on negative boreDiameter', () => {
      const result = validateFields([{ canonicalName: 'boreDiameter', value: -5, unit: 'mm' }]);
      expect(result.valid).toBe(false);
    });

    it('errors on negative weight', () => {
      const result = validateFields([{ canonicalName: 'weight', value: -1, unit: 'kg' }]);
      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe('INVALID_NON_POSITIVE');
    });

    it('errors on minimumPressure >= maximumPressure', () => {
      const result = validateFields([
        { canonicalName: 'minimumPressure', value: 100, unit: 'bar' },
        { canonicalName: 'maximumPressure', value: 50, unit: 'bar' },
      ]);
      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe('INVALID_RANGE');
    });

    it('errors on rodDiameter >= boreDiameter', () => {
      const result = validateFields([
        { canonicalName: 'boreDiameter', value: 50, unit: 'mm' },
        { canonicalName: 'rodDiameter', value: 50, unit: 'mm' },
      ]);
      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe('INVALID_DIMENSION');
    });

    it('warns on non-numeric value for numeric field', () => {
      const result = validateFields([{ canonicalName: 'maximumPressure', value: 'unknown' }]);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0].code).toBe('NON_NUMERIC_VALUE');
    });

    it('errors on pressure exceeding max (10000 bar)', () => {
      const result = validateFields([{ canonicalName: 'maximumPressure', value: 15000, unit: 'bar' }]);
      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe('ABOVE_MAXIMUM');
    });
  });

  describe('validateProductRequiredFields', () => {
    it('returns no errors when all required fields present', () => {
      const errors = validateProductRequiredFields({ sku: 'HC-5020', name: 'Test Product' });
      expect(errors).toHaveLength(0);
    });

    it('returns error when sku missing', () => {
      const errors = validateProductRequiredFields({ name: 'Test' });
      expect(errors.some((e) => e.field === 'sku')).toBe(true);
    });
  });
});
