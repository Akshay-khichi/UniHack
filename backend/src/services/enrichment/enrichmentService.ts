import { getExtractionModel, isGeminiConfigured } from '../../config/gemini';
import { ENRICHMENT_PROMPT } from '../../prompts/extractionPrompt';
import { parseGeminiJson } from '../../utils/jsonParser';
import { retrieveCategoryKnowledge } from './retrievalService';
import { ICategoryKnowledgeDocument } from '../../models/CategoryKnowledge';
import { logger } from '../../utils/logger';

export type EnrichedFieldStatus = 'AI_INFERENCE' | 'UNVERIFIED';

export interface EnrichedField {
  canonicalName: string;
  suggestedValue: string | number | null;
  unit?: string | null;
  confidence: number;
  reasoning: string;
  status: EnrichedFieldStatus;  // NEVER FACT — always AI_INFERENCE or UNVERIFIED
}

export interface EnrichmentResult {
  enrichedFields: EnrichedField[];
  knowledgeUsed: number;
  skipped: boolean;
  skipReason?: string;
}

interface GeminiEnrichmentResponse {
  enrichedFields: Array<{
    canonicalName: string;
    suggestedValue: unknown;
    unit?: string | null;
    confidence: number;
    reasoning: string;
    status: string;
  }>;
}

const MIN_CONFIDENCE_FOR_AI_INFERENCE = 0.7;

/**
 * Enrich product fields using category knowledge base.
 * CRITICAL: AI enrichment NEVER produces FACT status.
 * Values with confidence >= 0.7 → AI_INFERENCE
 * Values with confidence < 0.7 → UNVERIFIED (or null, not stored)
 */
export async function enrichProduct(
  category: string,
  existingFieldNames: string[],
): Promise<EnrichmentResult> {
  if (!isGeminiConfigured()) {
    return { enrichedFields: [], knowledgeUsed: 0, skipped: true, skipReason: 'Gemini not configured' };
  }

  if (!category || !category.trim()) {
    return { enrichedFields: [], knowledgeUsed: 0, skipped: true, skipReason: 'No category specified' };
  }

  // Retrieve relevant knowledge
  const knowledge = await retrieveCategoryKnowledge(category, `${category} technical specifications`);

  if (knowledge.length === 0) {
    return {
      enrichedFields: [],
      knowledgeUsed: 0,
      skipped: true,
      skipReason: 'No knowledge found for category',
    };
  }

  const model = getExtractionModel();
  const knowledgeSummary = buildKnowledgeSummary(knowledge);
  const existingFieldsStr = existingFieldNames.join(', ') || 'none';

  const prompt = `${ENRICHMENT_PROMPT}

PRODUCT CATEGORY: ${category}

EXISTING FIELDS (already extracted — do NOT re-suggest these): ${existingFieldsStr}

CATEGORY KNOWLEDGE BASE:
${knowledgeSummary}

Return ONLY fields that are NOT already in the existing fields list.
For any field where you cannot make a confident suggestion (< 0.7 confidence), set suggestedValue to null.`;

  try {
    const result = await Promise.race([
      model.generateContent(prompt),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Enrichment timeout')), 30000)),
    ]);

    const rawText = result.response.text();
    const parsed = parseGeminiJson<GeminiEnrichmentResponse>(rawText);

    if (!parsed.success) {
      logger.warn({ error: parsed.error }, 'Enrichment JSON parse failed');
      return { enrichedFields: [], knowledgeUsed: knowledge.length, skipped: false };
    }

    const enrichedFields = (parsed.data.enrichedFields || [])
      .filter((f) => f.suggestedValue !== null && f.suggestedValue !== undefined)
      .map((f) => {
        const confidence = clamp(Number(f.confidence ?? 0), 0, 1);
        // CRITICAL: Never FACT. High confidence → AI_INFERENCE, low → UNVERIFIED
        const status: EnrichedFieldStatus = confidence >= MIN_CONFIDENCE_FOR_AI_INFERENCE
          ? 'AI_INFERENCE'
          : 'UNVERIFIED';

        return {
          canonicalName: String(f.canonicalName || '').trim(),
          suggestedValue: (typeof f.suggestedValue === 'string' || typeof f.suggestedValue === 'number')
            ? f.suggestedValue
            : null,
          unit: typeof f.unit === 'string' ? f.unit : null,
          confidence,
          reasoning: String(f.reasoning || '').substring(0, 500),
          status,
        } satisfies EnrichedField;
      })
      .filter((f) => f.canonicalName && f.suggestedValue !== null);

    return { enrichedFields, knowledgeUsed: knowledge.length, skipped: false };
  } catch (err) {
    logger.warn({ error: (err as Error).message }, 'Enrichment failed');
    return { enrichedFields: [], knowledgeUsed: knowledge.length, skipped: false };
  }
}

function buildKnowledgeSummary(knowledge: ICategoryKnowledgeDocument[]): string {
  return knowledge
    .map((k) => {
      const parts: string[] = [`Field: ${k.fieldName}`];
      if (k.typicalRange) {
        parts.push(`  Typical range: ${k.typicalRange.min ?? '?'}–${k.typicalRange.max ?? '?'} ${k.typicalRange.unit || ''}`);
      }
      if (k.typicalValues && k.typicalValues.length > 0) {
        parts.push(`  Typical values: ${k.typicalValues.map((v) => `${v.value}${v.unit ? ` ${v.unit}` : ''}`).join(', ')}`);
      }
      if (k.description) parts.push(`  Description: ${k.description}`);
      return parts.join('\n');
    })
    .join('\n\n');
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
