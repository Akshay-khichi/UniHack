/**
 * Validation Service : deterministic, no AI.
 * Validates field values against constraints, ranges, and cross-field rules.
 */

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  value?: unknown;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export interface FieldToValidate {
  canonicalName: string;
  value: string | number;
  unit?: string;
}

// ── Numeric constraints ──────────────────────────────────────────────────────

const NUMERIC_CONSTRAINTS: Record<string, { min?: number; max?: number; unit?: string; required?: boolean }> = {
  boreDiameter:        { min: 0, unit: 'mm' },
  rodDiameter:         { min: 0, unit: 'mm' },
  stroke:              { min: 0, unit: 'mm' },
  weight:              { min: 0, unit: 'kg' },
  length:              { min: 0, unit: 'mm' },
  width:               { min: 0, unit: 'mm' },
  height:              { min: 0, unit: 'mm' },
  diameter:            { min: 0, unit: 'mm' },
  maximumPressure:     { min: 0, max: 10000, unit: 'bar' },
  minimumPressure:     { min: 0, unit: 'bar' },
  operatingPressure:   { min: 0, unit: 'bar' },
  maximumTemperature:  { min: -300, max: 2000, unit: '°C' },
  minimumTemperature:  { min: -300, max: 2000, unit: '°C' },
  operatingTemperature:{ min: -300, max: 2000, unit: '°C' },
  voltage:             { min: 0, max: 100000 },
  current:             { min: 0, max: 10000 },
  power:               { min: 0 },
  flowRate:            { min: 0 },
};

// ── Required fields ──────────────────────────────────────────────────────────

const REQUIRED_PRODUCT_FIELDS = ['sku', 'name'];

// ── Public API ───────────────────────────────────────────────────────────────

export function validateFields(fields: FieldToValidate[]): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  for (const field of fields) {
    const constraints = NUMERIC_CONSTRAINTS[field.canonicalName];
    if (!constraints) continue;

    const numValue = typeof field.value === 'string' ? parseFloat(field.value) : field.value;

    if (typeof numValue !== 'number' || isNaN(numValue)) {
      // Not a numeric value for a numeric field : warn but don't error
      warnings.push({
        field: field.canonicalName,
        code: 'NON_NUMERIC_VALUE',
        message: `Expected numeric value for ${field.canonicalName}`,
        value: field.value,
      });
      continue;
    }

    // Fields with min=0 require strictly positive values : unify zero and negative under one code
    if (constraints.min === 0 && numValue <= 0) {
      errors.push({
        field: field.canonicalName,
        code: 'INVALID_NON_POSITIVE',
        message: `${field.canonicalName} must be greater than 0 (got ${numValue})`,
        value: numValue,
      });
    } else if (constraints.min !== undefined && numValue < constraints.min) {
      errors.push({
        field: field.canonicalName,
        code: 'BELOW_MINIMUM',
        message: `${field.canonicalName} is below minimum of ${constraints.min} (got ${numValue})`,
        value: numValue,
      });
    }

    if (constraints.max !== undefined && numValue > constraints.max) {
      errors.push({
        field: field.canonicalName,
        code: 'ABOVE_MAXIMUM',
        message: `${field.canonicalName} exceeds maximum of ${constraints.max} (got ${numValue})`,
        value: numValue,
      });
    }
  }

  // Cross-field rules
  const fieldMap = new Map(fields.map((f) => [f.canonicalName, f]));

  // min < max for pressure
  const minPressure = fieldMap.get('minimumPressure');
  const maxPressure = fieldMap.get('maximumPressure');
  if (minPressure && maxPressure) {
    const min = toNum(minPressure.value);
    const max = toNum(maxPressure.value);
    if (min !== null && max !== null && min >= max) {
      errors.push({
        field: 'minimumPressure/maximumPressure',
        code: 'INVALID_RANGE',
        message: `minimumPressure (${min}) must be less than maximumPressure (${max})`,
      });
    }
  }

  // min < max for temperature
  const minTemp = fieldMap.get('minimumTemperature');
  const maxTemp = fieldMap.get('maximumTemperature');
  if (minTemp && maxTemp) {
    const min = toNum(minTemp.value);
    const max = toNum(maxTemp.value);
    if (min !== null && max !== null && min >= max) {
      errors.push({
        field: 'minimumTemperature/maximumTemperature',
        code: 'INVALID_RANGE',
        message: `minimumTemperature (${min}) must be less than maximumTemperature (${max})`,
      });
    }
  }

  // rodDiameter < boreDiameter
  const bore = fieldMap.get('boreDiameter');
  const rod = fieldMap.get('rodDiameter');
  if (bore && rod) {
    const boreVal = toNum(bore.value);
    const rodVal = toNum(rod.value);
    if (boreVal !== null && rodVal !== null && rodVal >= boreVal) {
      errors.push({
        field: 'rodDiameter/boreDiameter',
        code: 'INVALID_DIMENSION',
        message: `rodDiameter (${rodVal}) must be less than boreDiameter (${boreVal})`,
      });
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateProductRequiredFields(fields: Record<string, unknown>): ValidationError[] {
  return REQUIRED_PRODUCT_FIELDS
    .filter((f) => !fields[f] || String(fields[f]).trim() === '')
    .map((f) => ({
      field: f,
      code: 'REQUIRED_FIELD_MISSING',
      message: `${f} is required`,
    }));
}

function toNum(value: string | number): number | null {
  const n = typeof value === 'number' ? value : parseFloat(value);
  return isNaN(n) ? null : n;
}
