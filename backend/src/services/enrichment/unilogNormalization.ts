// UniHack UOM normalization rules (approved abbreviations from Unilog spec)
// Format: { pattern: RegExp, canonical: string }

export interface UomRule {
  pattern: RegExp;
  canonical: string;
}

export const UOM_RULES: UomRule[] = [
  // Length
  { pattern: /^in(ch(es?)?)?\.?$/i, canonical: 'in' },
  { pattern: /^"$/, canonical: 'in' },
  { pattern: /^ft(eet?)?\.?$/i, canonical: 'ft' },
  { pattern: /^'$/, canonical: 'ft' },
  { pattern: /^mm(illimeters?)?\.?$/i, canonical: 'mm' },
  { pattern: /^cm(entimeters?)?\.?$/i, canonical: 'cm' },
  { pattern: /^m(eter)?s?\.?$/i, canonical: 'm' },
  // Weight
  { pattern: /^lbs?\.?$/i, canonical: 'lb' },
  { pattern: /^pound(s)?\.?$/i, canonical: 'lb' },
  { pattern: /^oz(ounces?)?\.?$/i, canonical: 'oz' },
  { pattern: /^kg(s|ilograms?)?\.?$/i, canonical: 'kg' },
  { pattern: /^g(rams?)?\.?$/i, canonical: 'g' },
  // Voltage
  { pattern: /^v(olts?)?\.?$/i, canonical: 'V' },
  { pattern: /^vac$/i, canonical: 'VAC' },
  { pattern: /^vdc$/i, canonical: 'VDC' },
  // Current
  { pattern: /^a(mps?|mperes?)?\.?$/i, canonical: 'A' },
  { pattern: /^ma(milliamps?)?\.?$/i, canonical: 'mA' },
  // Power
  { pattern: /^w(atts?)?\.?$/i, canonical: 'W' },
  { pattern: /^kw(ilowatts?)?\.?$/i, canonical: 'kW' },
  { pattern: /^hp(orsepower)?\.?$/i, canonical: 'hp' },
  // Pressure
  { pattern: /^psi\.?$/i, canonical: 'psi' },
  { pattern: /^bar\.?$/i, canonical: 'bar' },
  { pattern: /^psi\.?$/i, canonical: 'psi' },
  { pattern: /^kpa$/i, canonical: 'kPa' },
  { pattern: /^mpa$/i, canonical: 'MPa' },
  // Temperature
  { pattern: /^([°]|deg\s*)?f(ahrenheit)?\.?$/i, canonical: '°F' },
  { pattern: /^([°]|deg\s*)?c(elsius)?\.?$/i, canonical: '°C' },
  // Sound
  { pattern: /^dba?\.?$/i, canonical: 'dBA' },
  // Flow
  { pattern: /^gpm\.?$/i, canonical: 'gpm' },
  { pattern: /^cfm\.?$/i, canonical: 'CFM' },
  { pattern: /^lpm\.?$/i, canonical: 'L/min' },
  // Frequency
  { pattern: /^hz\.?$/i, canonical: 'Hz' },
  // Energy
  { pattern: /^kwh?\.?$/i, canonical: 'kW-hr' },
  // Volume
  { pattern: /^gal(lons?)?\.?$/i, canonical: 'gal' },
  { pattern: /^qt(quarts?)?\.?$/i, canonical: 'qt' },
  { pattern: /^oz(fluid)?\.?$/i, canonical: 'fl oz' },
  // RPM
  { pattern: /^rpm\.?$/i, canonical: 'rpm' },
];

// Decimal to fraction lookup for inch measurements (per hackathon spec)
export const DECIMAL_FRACTION_MAP: Record<string, string> = {
  '0.015625': '1/64', '0.03125': '1/32', '0.046875': '3/64',
  '0.0625': '1/16', '0.078125': '5/64', '0.09375': '3/32',
  '0.109375': '7/64', '0.125': '1/8', '0.140625': '9/64',
  '0.15625': '5/32', '0.171875': '11/64', '0.1875': '3/16',
  '0.203125': '13/64', '0.21875': '7/32', '0.234375': '15/64',
  '0.25': '1/4', '0.265625': '17/64', '0.28125': '9/32',
  '0.296875': '19/64', '0.3125': '5/16', '0.328125': '21/64',
  '0.34375': '11/32', '0.359375': '23/64', '0.375': '3/8',
  '0.390625': '25/64', '0.40625': '13/32', '0.421875': '27/64',
  '0.4375': '7/16', '0.453125': '29/64', '0.46875': '15/32',
  '0.484375': '31/64', '0.5': '1/2', '0.515625': '33/64',
  '0.53125': '17/32', '0.546875': '35/64', '0.5625': '9/16',
  '0.578125': '37/64', '0.59375': '19/32', '0.609375': '39/64',
  '0.625': '5/8', '0.640625': '41/64', '0.65625': '21/32',
  '0.671875': '43/64', '0.6875': '11/16', '0.703125': '45/64',
  '0.71875': '23/32', '0.734375': '47/64', '0.75': '3/4',
  '0.765625': '49/64', '0.78125': '25/32', '0.796875': '51/64',
  '0.8125': '13/16', '0.828125': '53/64', '0.84375': '27/32',
  '0.859375': '55/64', '0.875': '7/8', '0.890625': '57/64',
  '0.90625': '29/32', '0.921875': '59/64', '0.9375': '15/16',
  '0.953125': '61/64', '0.96875': '31/32', '0.984375': '63/64',
};

/**
 * Normalize a unit string to the Unilog-approved abbreviation.
 * Returns original if no match found.
 */
export function normalizeUom(raw: string): string {
  const trimmed = raw.trim();
  for (const rule of UOM_RULES) {
    if (rule.pattern.test(trimmed)) return rule.canonical;
  }
  return trimmed;
}

/**
 * Format a number + unit string with a space between them (per Unilog spec: "24 in" not "24in").
 */
export function formatMeasurement(value: string | number, unit: string): string {
  const canonical = normalizeUom(unit);
  return `${value} ${canonical}`;
}

function simplifyFraction(numerator: number, denominator: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(numerator, denominator);
  const num = numerator / divisor;
  const den = denominator / divisor;
  if (den === 1) return String(num);
  return `${num}/${den}`;
}

/**
 * Convert decimal inches to fraction string.
 * Uses exact lookup first, and falls back to a 1/64th fraction approximation algorithm when exact lookup fails.
 */
export function decimalToFraction(decimal: number): string {
  if (isNaN(decimal) || !isFinite(decimal)) return String(decimal);
  const whole = Math.floor(decimal);
  const fracNum = Number((decimal - whole).toFixed(6));
  if (fracNum === 0) return String(whole);

  const exactStr = DECIMAL_FRACTION_MAP[String(fracNum)];
  if (exactStr) {
    return whole === 0 ? exactStr : `${whole}-${exactStr}`;
  }

  // Fraction approximation algorithm (nearest 1/64th)
  const num64 = Math.round(fracNum * 64);
  if (num64 === 0) return String(whole);
  if (num64 === 64) return String(whole + 1);

  const simplified = simplifyFraction(num64, 64);
  return whole === 0 ? simplified : `${whole}-${simplified}`;
}

/**
 * Check if decimal measurement required approximation with error delta > 0.005.
 * Returns warning string to flag NEEDS_HUMAN_REVIEW.
 */
export function checkFractionApproximationWarning(decimal: number): string | null {
  const whole = Math.floor(decimal);
  const fracNum = Number((decimal - whole).toFixed(6));
  if (fracNum === 0 || DECIMAL_FRACTION_MAP[String(fracNum)]) return null;

  const num64 = Math.round(fracNum * 64);
  const approxFrac = num64 / 64;
  const delta = Math.abs(fracNum - approxFrac);
  if (delta > 0.005) {
    return `Decimal measurement ${decimal} could not be exact matched; approximated to nearest 1/64th (${decimalToFraction(decimal)}) with delta ${delta.toFixed(4)}.`;
  }
  return null;
}

/**
 * Strip known placeholder strings from brand/manufacturer fields.
 */
export const PLACEHOLDER_PATTERNS = [
  /^--\s*unbranded\s*--$/i,
  /^--\s*no unilog brand\s*--$/i,
  /^--\s*no dib brand\s*--$/i,
  /^n\/a$/i,
  /^unknown$/i,
  /^none$/i,
];

export function cleanPlaceholder(value: string): string | null {
  const trimmed = value.trim();
  for (const pat of PLACEHOLDER_PATTERNS) {
    if (pat.test(trimmed)) return null;
  }
  return trimmed || null;
}

/**
 * Extract manufacturer code from "Manufacturer Name (CODE)" format.
 */
export function parseManufacturerField(raw: string): { name: string; code: string | null } {
  const match = raw.match(/^(.+?)\s*\(([A-Z0-9]+)\)\s*$/);
  if (match) return { name: match[1].trim(), code: match[2] };
  return { name: raw.trim(), code: null };
}
