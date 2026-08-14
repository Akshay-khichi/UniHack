/**
 * Contradiction Engine — deterministic, no AI.
 *
 * Rules:
 * - NEVER delete a value
 * - NEVER select a winner
 * - NEVER silently resolve a conflict
 * - Numeric values normalized before comparison (210 bar == 21,000 kPa → no contradiction)
 * - Strings compared case/whitespace-insensitively
 * - Deterministic contradictionGroupId (sorted canonicalName + first two values)
 */

import crypto from 'crypto';
import { PRESSURE_TO_BAR, LENGTH_TO_MM, MASS_TO_KG } from '../normalization/normalizationService';

export interface EvidenceObservation {
  id: string;
  documentId: string;
  canonicalName: string;
  value: string | number;
  unit?: string;
  sourceType: string;
  excerpt?: string;
  pageNumber?: number;
}

export type ContradictionStatus = 'CONSISTENT' | 'CONFLICT' | 'SINGLE_SOURCE';

export interface ContradictionGroup {
  canonicalName: string;
  status: ContradictionStatus;
  contradictionGroupId: string;
  observations: EvidenceObservation[];
  conflictingPairs?: Array<{
    observationA: EvidenceObservation;
    observationB: EvidenceObservation;
    reason: string;
  }>;
}

export interface ContradictionReport {
  groups: ContradictionGroup[];
  hasConflicts: boolean;
  conflictCount: number;
  conflictFields: string[];
}

// ── Tolerance for floating-point comparison ───────────────────────────────────

const NUMERIC_TOLERANCE = 1e-6;

// ── Public API ────────────────────────────────────────────────────────────────

export function detectContradictions(observations: EvidenceObservation[]): ContradictionReport {
  // Group by canonical field name
  const byField = new Map<string, EvidenceObservation[]>();
  for (const obs of observations) {
    const existing = byField.get(obs.canonicalName) || [];
    existing.push(obs);
    byField.set(obs.canonicalName, existing);
  }

  const groups: ContradictionGroup[] = [];

  for (const [canonicalName, fieldObs] of byField.entries()) {
    if (fieldObs.length === 1) {
      groups.push({
        canonicalName,
        status: 'SINGLE_SOURCE',
        contradictionGroupId: makeGroupId(canonicalName, fieldObs),
        observations: fieldObs,
      });
      continue;
    }

    const conflictingPairs: ContradictionGroup['conflictingPairs'] = [];

    for (let i = 0; i < fieldObs.length; i++) {
      for (let j = i + 1; j < fieldObs.length; j++) {
        const a = fieldObs[i];
        const b = fieldObs[j];
        const conflict = checkConflict(a, b);
        if (conflict) {
          conflictingPairs!.push({ observationA: a, observationB: b, reason: conflict });
        }
      }
    }

    const status: ContradictionStatus = conflictingPairs!.length > 0 ? 'CONFLICT' : 'CONSISTENT';

    groups.push({
      canonicalName,
      status,
      contradictionGroupId: makeGroupId(canonicalName, fieldObs),
      observations: fieldObs,
      ...(status === 'CONFLICT' && { conflictingPairs }),
    });
  }

  const conflictGroups = groups.filter((g) => g.status === 'CONFLICT');

  return {
    groups,
    hasConflicts: conflictGroups.length > 0,
    conflictCount: conflictGroups.length,
    conflictFields: conflictGroups.map((g) => g.canonicalName),
  };
}

// ── Comparison logic ──────────────────────────────────────────────────────────

function checkConflict(a: EvidenceObservation, b: EvidenceObservation): string | null {
  const aNum = toNumber(a.value);
  const bNum = toNumber(b.value);

  // Both numeric
  if (aNum !== null && bNum !== null) {
    const aNorm = normalizeNumeric(aNum, a.unit, a.canonicalName);
    const bNorm = normalizeNumeric(bNum, b.unit, b.canonicalName);

    if (aNorm === null || bNorm === null) {
      // Can't normalize — compare raw
      if (Math.abs(aNum - bNum) > NUMERIC_TOLERANCE) {
        return `Numeric values differ: ${aNum} ${a.unit || ''} vs ${bNum} ${b.unit || ''}`;
      }
      return null;
    }

    if (Math.abs(aNorm - bNorm) > NUMERIC_TOLERANCE) {
      return `Normalized values differ: ${aNorm} (base unit) vs ${bNorm} (base unit) — original: ${aNum} ${a.unit || ''} vs ${bNum} ${b.unit || ''}`;
    }
    return null;
  }

  // Both strings
  if (typeof a.value === 'string' && typeof b.value === 'string') {
    const aNorm = normalizeString(a.value);
    const bNorm = normalizeString(b.value);
    if (aNorm !== bNorm) {
      return `String values differ: "${a.value}" vs "${b.value}"`;
    }
    return null;
  }

  // Mixed types — always a conflict
  return `Type mismatch: ${typeof a.value} vs ${typeof b.value}`;
}

function normalizeNumeric(value: number, unit: string | undefined, canonicalName: string): number | null {
  if (!unit) return value;
  const u = unit.toLowerCase().trim();

  // Pressure → bar
  if (/pressure/i.test(canonicalName)) {
    const factor = PRESSURE_TO_BAR[u];
    return factor !== undefined ? value * factor : null;
  }

  // Length → mm
  if (/diameter|stroke|length|width|height|bore|rod/i.test(canonicalName)) {
    const factor = LENGTH_TO_MM[u];
    return factor !== undefined ? value * factor : null;
  }

  // Mass → kg
  if (/weight|mass/i.test(canonicalName)) {
    const factor = MASS_TO_KG[u];
    return factor !== undefined ? value * factor : null;
  }

  return null; // unknown unit type
}

function normalizeString(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

function toNumber(value: string | number): number | null {
  if (typeof value === 'number') return value;
  const n = parseFloat(value);
  return isNaN(n) ? null : n;
}

// ── Deterministic group ID ────────────────────────────────────────────────────

function makeGroupId(canonicalName: string, observations: EvidenceObservation[]): string {
  const values = observations
    .map((o) => `${String(o.value)}${o.unit || ''}`)
    .sort()
    .join('|');
  const input = `${canonicalName}:${values}`;
  return crypto.createHash('sha256').update(input).digest('hex').substring(0, 16);
}
