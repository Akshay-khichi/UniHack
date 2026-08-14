/**
 * Normalization Service : deterministic, no AI.
 * Handles: canonical field names, aliases, unit conversion, value preservation.
 */

// ── Unit conversion tables ────────────────────────────────────────────────────

// Pressure: all converted to bar (base unit)
const PRESSURE_TO_BAR: Record<string, number> = {
  bar: 1,
  bars: 1,
  mbar: 0.001,
  psi: 0.0689476,
  'lb/in2': 0.0689476,
  kpa: 0.01,
  mpa: 10,
  pa: 0.00001,
  atm: 1.01325,
  'kgf/cm2': 0.980665,
  torr: 0.00133322,
};

// Length: all converted to mm (base unit)
const LENGTH_TO_MM: Record<string, number> = {
  mm: 1,
  cm: 10,
  m: 1000,
  in: 25.4,
  '"': 25.4,
  ft: 304.8,
  um: 0.001,
  µm: 0.001,
  inch: 25.4,
  inches: 25.4,
};

// Mass: all converted to kg (base unit)
const MASS_TO_KG: Record<string, number> = {
  kg: 1,
  g: 0.001,
  lb: 0.453592,
  lbs: 0.453592,
  oz: 0.0283495,
  t: 1000,
};

// Temperature: base unit is °C
const TEMPERATURE_CONVERSIONS: Record<string, (v: number) => number> = {
  '°c': (v) => v,
  'c': (v) => v,
  'celsius': (v) => v,
  '°f': (v) => (v - 32) * 5 / 9,
  'f': (v) => (v - 32) * 5 / 9,
  'fahrenheit': (v) => (v - 32) * 5 / 9,
  'k': (v) => v - 273.15,
  'kelvin': (v) => v - 273.15,
};

// ── Field aliases → canonical names ──────────────────────────────────────────

const FIELD_ALIASES: Record<string, string> = {
  // Pressure
  'max pressure': 'maximumPressure',
  'maximum pressure': 'maximumPressure',
  'max. pressure': 'maximumPressure',
  'max operating pressure': 'maximumPressure',
  'operating pressure max': 'maximumPressure',
  'rated pressure': 'maximumPressure',
  'proof pressure': 'maximumPressure',
  'min pressure': 'minimumPressure',
  'minimum pressure': 'minimumPressure',
  'working pressure': 'operatingPressure',
  'operating pressure': 'operatingPressure',

  // Temperature
  'max temperature': 'maximumTemperature',
  'maximum temperature': 'maximumTemperature',
  'max temp': 'maximumTemperature',
  'temperature max': 'maximumTemperature',
  'min temperature': 'minimumTemperature',
  'minimum temperature': 'minimumTemperature',
  'ambient temperature': 'operatingTemperature',
  'operating temperature': 'operatingTemperature',
  'temperature range': 'operatingTemperature',

  // Dimensions
  'bore': 'boreDiameter',
  'bore diameter': 'boreDiameter',
  'bore size': 'boreDiameter',
  'piston diameter': 'boreDiameter',
  'rod': 'rodDiameter',
  'rod diameter': 'rodDiameter',
  'rod size': 'rodDiameter',
  'stroke': 'stroke',
  'stroke length': 'stroke',

  // Weight/Mass
  'weight': 'weight',
  'mass': 'weight',
  'net weight': 'weight',

  // Electrical
  'voltage': 'voltage',
  'supply voltage': 'voltage',
  'rated voltage': 'voltage',
  'current': 'current',
  'rated current': 'current',
  'power': 'power',
  'rated power': 'power',

  // Part/Model
  'part number': 'partNumber',
  'part no': 'partNumber',
  'part no.': 'partNumber',
  'model': 'modelNumber',
  'model number': 'modelNumber',
  'model no': 'modelNumber',
  'series': 'series',
  'product code': 'partNumber',

  // Material
  'material': 'material',
  'body material': 'bodyMaterial',
  'seal material': 'sealMaterial',
  'seal': 'sealMaterial',

  // Port
  'port size': 'portSize',
  'port': 'portSize',
  'port thread': 'portThread',
  'thread': 'portThread',

  // Media
  'medium': 'operatingMedium',
  'media': 'operatingMedium',
  'fluid': 'operatingMedium',
  'operating medium': 'operatingMedium',
  'fluid compatibility': 'fluidCompatibility',

  // Certifications
  'certifications': 'certifications',
  'approvals': 'approvals',
  'standards': 'standards',
};

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface NormalizedField {
  fieldName: string;
  canonicalName: string;
  originalValue: string | number;
  originalUnit?: string;
  normalizedValue: string | number;
  normalizedUnit?: string;
  conversionApplied: boolean;
}

// ── Public API ────────────────────────────────────────────────────────────────

export function normalizeFieldName(rawName: string): string {
  const lower = rawName.toLowerCase().trim();
  return FIELD_ALIASES[lower] || toCamelCase(rawName);
}

export function normalizeField(
  fieldName: string,
  value: string | number,
  unit?: string,
): NormalizedField {
  const canonicalName = normalizeFieldName(fieldName);
  const result: NormalizedField = {
    fieldName,
    canonicalName,
    originalValue: value,
    originalUnit: unit,
    normalizedValue: value,
    normalizedUnit: unit,
    conversionApplied: false,
  };

  if (typeof value !== 'number' || !unit) return result;

  const unitLower = unit.toLowerCase().trim();

  // Pressure normalization
  const pressureFactor = PRESSURE_TO_BAR[unitLower];
  if (pressureFactor !== undefined && isPressureField(canonicalName)) {
    result.normalizedValue = roundTo(value * pressureFactor, 6);
    result.normalizedUnit = 'bar';
    result.conversionApplied = true;
    return result;
  }

  // Length normalization
  const lengthFactor = LENGTH_TO_MM[unitLower];
  if (lengthFactor !== undefined && isLengthField(canonicalName)) {
    result.normalizedValue = roundTo(value * lengthFactor, 4);
    result.normalizedUnit = 'mm';
    result.conversionApplied = true;
    return result;
  }

  // Mass normalization
  const massFactor = MASS_TO_KG[unitLower];
  if (massFactor !== undefined && isMassField(canonicalName)) {
    result.normalizedValue = roundTo(value * massFactor, 6);
    result.normalizedUnit = 'kg';
    result.conversionApplied = true;
    return result;
  }

  // Temperature normalization
  const tempConverter = TEMPERATURE_CONVERSIONS[unitLower];
  if (tempConverter !== undefined && isTemperatureField(canonicalName)) {
    result.normalizedValue = roundTo(tempConverter(value), 4);
    result.normalizedUnit = '°C';
    result.conversionApplied = true;
    return result;
  }

  return result;
}

// ── Field category helpers ────────────────────────────────────────────────────

function isPressureField(name: string): boolean {
  return /pressure/i.test(name);
}

function isLengthField(name: string): boolean {
  return /diameter|stroke|length|width|height|bore|rod/i.test(name);
}

function isMassField(name: string): boolean {
  return /weight|mass/i.test(name);
}

function isTemperatureField(name: string): boolean {
  return /temperature|temp/i.test(name);
}

// ── String utilities ──────────────────────────────────────────────────────────

function toCamelCase(str: string): string {
  return str
    .trim()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, char: string) => char.toUpperCase())
    .replace(/^[A-Z]/, (c) => c.toLowerCase());
}

function roundTo(value: number, decimals: number): number {
  return Math.round(value * 10 ** decimals) / 10 ** decimals;
}

export { PRESSURE_TO_BAR, LENGTH_TO_MM, MASS_TO_KG };
