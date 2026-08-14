import { getExtractionModel, isGeminiConfigured } from '../../config/gemini';
import { UNILOG_ENRICHMENT_PROMPT } from '../../prompts/unilogEnrichmentPrompt';
import { parseGeminiJson } from '../../utils/jsonParser';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';
import {
  cleanPlaceholder,
  parseManufacturerField,
  normalizeUom,
} from './unilogNormalization';

// ─── Input / Output Types ────────────────────────────────────────────────────

export interface RawProductRow {
  mfg_part_num: string;
  part_desc: string;
  e1_brand?: string;
  unilog_brand?: string;
  dib_brand?: string;
  part_manuf: string;
}

export interface UnilogAttribute {
  label: string;
  value: string;
  uom: string | null;
  confidence: number;
}

export interface EnrichedUnilogProduct {
  // Input passthrough
  mfg_part_num: string;
  raw_part_desc: string;
  // Resolved manufacturer/brand
  manufacturer_name: string;
  brand_name: string;
  // Taxonomy
  classpath: string;
  dept: string;
  class_name: string;
  fine: string;
  // 5-Tier Descriptions
  invoice_desc: string;
  mobile_desc: string;
  short_desc: string;
  long_desc: string;
  marketing_description: string;
  product_name: string;
  // Attributes (up to 20)
  attributes: UnilogAttribute[];
  // Quality
  overall_confidence: number;
  needs_human_review: boolean;
  review_reason: string | null;
  warnings: string[];
}

// ─── Brand resolution ────────────────────────────────────────────────────────

function resolveBrand(row: RawProductRow): string | null {
  const candidates = [row.unilog_brand, row.dib_brand, row.e1_brand];
  for (const c of candidates) {
    if (!c) continue;
    const cleaned = cleanPlaceholder(c);
    if (cleaned) return cleaned;
  }
  return null;
}

// ─── Core enrichment function ─────────────────────────────────────────────────

export async function enrichRawProductRow(
  row: RawProductRow,
): Promise<EnrichedUnilogProduct> {
  if (!isGeminiConfigured()) {
    throw AppError.serviceUnavailable('Gemini — GEMINI_API_KEY not configured');
  }

  const { name: manufName } = parseManufacturerField(row.part_manuf);
  const resolvedBrand = resolveBrand(row);

  const prompt = `${UNILOG_ENRICHMENT_PROMPT}

RAW PRODUCT ROW:
- Mfg_Part_Num: ${row.mfg_part_num}
- Part_Desc: ${row.part_desc}
- Part_Manuf: ${manufName}
- Cleaned_Brand: ${resolvedBrand ?? 'Unknown — use manufacturer name as brand'}`;

  const model = getExtractionModel();
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await Promise.race([
        model.generateContent(prompt),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Enrichment timeout')), 45000),
        ),
      ]);

      const rawText = result.response.text();
      const parsed = parseGeminiJson<Record<string, unknown>>(rawText);

      if (!parsed.success) {
        logger.warn({ attempt, error: parsed.error }, 'UniHack enrichment: malformed JSON, retrying');
        lastError = new Error(parsed.error);
        if (attempt < 3) await new Promise((r) => setTimeout(r, 1000 * attempt));
        continue;
      }

      const d = parsed.data;
      const rawAttributes = Array.isArray(d.attributes) ? d.attributes : [];

      // Normalize UOMs in attributes
      const attributes: UnilogAttribute[] = rawAttributes
        .slice(0, 20)
        .map((a: Record<string, unknown>) => ({
          label: String(a.label ?? ''),
          value: String(a.value ?? ''),
          uom: a.uom ? normalizeUom(String(a.uom)) : null,
          confidence: Math.min(1, Math.max(0, Number(a.confidence ?? 0.7))),
        }))
        .filter((a: UnilogAttribute) => a.label && a.value);

      // Determine human review flag (spec: trigger review when ANY attribute confidence < 0.6 or overall < 0.6)
      const overallConf = Number(d.overall_confidence ?? 0.7);
      const lowConfAttributes = attributes.filter((a) => a.confidence < 0.6);
      const hasAnyLowConfAttribute = lowConfAttributes.length > 0;

      const needsReview =
        Boolean(d.needs_human_review) ||
        overallConf < 0.6 ||
        hasAnyLowConfAttribute;

      const reviewReasons: string[] = [];
      if (d.review_reason) reviewReasons.push(String(d.review_reason));
      if (overallConf < 0.6) reviewReasons.push(`Overall confidence (${overallConf.toFixed(2)}) is below 0.6 threshold`);
      if (hasAnyLowConfAttribute) {
        reviewReasons.push(`Contains ${lowConfAttributes.length} attribute(s) (${lowConfAttributes.map((a) => a.label).join(', ')}) below 0.6 confidence threshold`);
      }

      // Enforce Invoice desc constraints (≤40 chars, ALL CAPS)
      let invoiceDesc = String(d.invoice_desc ?? '').toUpperCase();
      if (invoiceDesc.length > 40) invoiceDesc = invoiceDesc.substring(0, 40).trim();

      return {
        mfg_part_num: row.mfg_part_num,
        raw_part_desc: row.part_desc,
        manufacturer_name: String(d.manufacturer_name ?? manufName),
        brand_name: String(d.brand_name ?? resolvedBrand ?? manufName),
        classpath: String(d.classpath ?? ''),
        dept: String(d.dept ?? ''),
        class_name: String(d.class ?? ''),
        fine: String(d.fine ?? ''),
        invoice_desc: invoiceDesc,
        mobile_desc: String(d.mobile_desc ?? '').substring(0, 80),
        short_desc: String(d.short_desc ?? ''),
        long_desc: String(d.long_desc ?? ''),
        marketing_description: String(d.marketing_description ?? ''),
        product_name: String(d.product_name ?? ''),
        attributes,
        overall_confidence: overallConf,
        needs_human_review: needsReview,
        review_reason: reviewReasons.length > 0 ? reviewReasons.join('; ') : null,
        warnings: Array.isArray(d.warnings) ? d.warnings.map(String) : [],
      };
    } catch (err) {
      lastError = err as Error;
      logger.warn({ attempt, error: (err as Error).message }, 'UniHack enrichment attempt failed');
      if (attempt < 3) await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }

  throw AppError.externalServiceError(
    'UniHack enrichment',
    lastError?.message ?? 'All retry attempts failed',
  );
}

// ─── Parse raw CSV row ─────────────────────────────────────────────────────────

export function parseRawCsvRow(row: Record<string, string>): RawProductRow {
  return {
    mfg_part_num: (row['Mfg_Part_Num'] ?? row['mfg_part_num'] ?? '').trim(),
    part_desc: (row['Part_Desc'] ?? row['part_desc'] ?? '').trim(),
    e1_brand: (row['E1_Brand'] ?? row['e1_brand'] ?? '').trim() || undefined,
    unilog_brand: (row['Unilog_Brand'] ?? row['unilog_brand'] ?? '').trim() || undefined,
    dib_brand: (row['DIB_Brand'] ?? row['dib_brand'] ?? '').trim() || undefined,
    part_manuf: (row['Part_Manuf'] ?? row['part_manuf'] ?? '').trim(),
  };
}
