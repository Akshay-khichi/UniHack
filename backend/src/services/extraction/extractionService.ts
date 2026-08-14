import { getExtractionModel, isGeminiConfigured } from '../../config/gemini';
import { EXTRACTION_PROMPT } from '../../prompts/extractionPrompt';
import { parseGeminiJson } from '../../utils/jsonParser';
import { ExtractionInput, ExtractionResult, RawExtractedField } from './extractionTypes';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

interface GeminiExtractionResponse {
  fields: RawExtractedField[];
  warnings?: string[];
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extract structured fields from document content using Gemini.
 * Retries on transient failures. Never throws on malformed AI output.
 */
export async function extractFromDocument(input: ExtractionInput): Promise<ExtractionResult> {
  if (!isGeminiConfigured()) {
    throw AppError.serviceUnavailable('Gemini — GEMINI_API_KEY not configured');
  }

  const start = Date.now();
  const model = getExtractionModel();

  const contextSection = input.productContext
    ? `\n\nPRODUCT CONTEXT:\n${JSON.stringify(input.productContext, null, 2)}\n`
    : '';

  const prompt = `${EXTRACTION_PROMPT}${contextSection}

DOCUMENT DETAILS:
- Filename: ${input.filename}
- MIME Type: ${input.mimeType}
- Source Type: ${input.sourceType}

DOCUMENT CONTENT:
${input.content.substring(0, 50000)}`; // hard cap to avoid token overflow

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await Promise.race([
        model.generateContent(prompt),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini request timeout')), 30000),
        ),
      ]);

      const rawText = result.response.text();
      const parsed = parseGeminiJson<GeminiExtractionResponse>(rawText);

      if (!parsed.success) {
        logger.warn(
          { attempt, error: parsed.error },
          'Gemini returned malformed JSON — retrying',
        );
        lastError = new Error(parsed.error);
        if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS * attempt);
        continue;
      }

      const { fields, droppedCount } = validateAndSanitizeFields(parsed.data.fields || []);

      return {
        fields,
        rawText,
        processingTimeMs: Date.now() - start,
        model: 'gemini-1.5-pro',
        warnings: parsed.data.warnings || [],
        droppedFieldCount: droppedCount,
      };
    } catch (err) {
      lastError = err as Error;
      logger.warn({ attempt, error: (err as Error).message }, 'Gemini extraction attempt failed');
      if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS * attempt);
    }
  }

  // All retries exhausted
  throw AppError.externalServiceError(
    'Gemini extraction',
    lastError?.message || 'All retry attempts failed',
  );
}

function validateAndSanitizeFields(fields: unknown[]): { fields: RawExtractedField[]; droppedCount: number } {
  if (!Array.isArray(fields)) return { fields: [], droppedCount: 0 };

  const validFields: RawExtractedField[] = [];
  let droppedCount = 0;

  for (const f of fields) {
    if (typeof f !== 'object' || f === null) {
      droppedCount++;
      logger.warn({ rawDroppedField: f }, 'Extracted field dropped: element is not an object');
      continue;
    }
    const raw = f as Record<string, unknown>;
    const fieldName = String(raw.fieldName || '').trim();
    if (!fieldName) {
      droppedCount++;
      logger.warn({ rawDroppedField: f }, 'Extracted field dropped due to empty or invalid fieldName');
      continue;
    }

    validFields.push({
      fieldName,
      canonicalName: String(raw.canonicalName || fieldName).trim(),
      value: (typeof raw.value === 'number' || typeof raw.value === 'string') ? raw.value : String(raw.value ?? ''),
      unit: typeof raw.unit === 'string' ? raw.unit.trim() : undefined,
      confidence: clamp(Number(raw.confidence ?? 0.5), 0, 1),
      pageNumber: typeof raw.pageNumber === 'number' ? raw.pageNumber : undefined,
      excerpt: typeof raw.excerpt === 'string' ? raw.excerpt.substring(0, 500) : undefined,
      sourceType: typeof raw.sourceType === 'string' ? raw.sourceType : undefined,
    });
  }

  return { fields: validFields, droppedCount };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
