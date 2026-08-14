import { getExtractionModel, isGeminiConfigured } from '../../config/gemini';
import { VERIFICATION_PROMPT } from '../../prompts/extractionPrompt';
import { parseGeminiJson } from '../../utils/jsonParser';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';

export interface VerificationInput {
  claim: {
    fieldName: string;
    value: string | number;
    unit?: string;
  };
  sourceExcerpt: string;
  documentSourceType: string;
}

export interface VerificationOutput {
  status: 'VERIFIED' | 'UNVERIFIED' | 'CONTRADICTED';
  confidence: number;
  reasoning: string;
  supportingExcerpt?: string;
}

interface GeminiVerificationResponse {
  status: 'VERIFIED' | 'UNVERIFIED' | 'CONTRADICTED';
  confidence: number;
  reasoning: string;
  supportingExcerpt?: string | null;
}

const VALID_STATUSES = new Set(['VERIFIED', 'UNVERIFIED', 'CONTRADICTED']);

/**
 * Verify a specific claim against its source excerpt using Gemini.
 * Never invents support — defaults to UNVERIFIED on any ambiguity or failure.
 */
export async function verifyEvidence(input: VerificationInput): Promise<VerificationOutput> {
  if (!isGeminiConfigured()) {
    // Non-configured → UNVERIFIED, not an error
    return { status: 'UNVERIFIED', confidence: 0, reasoning: 'Gemini not configured' };
  }

  // Short-circuit: empty excerpt → always UNVERIFIED
  if (!input.sourceExcerpt || input.sourceExcerpt.trim() === '') {
    return {
      status: 'UNVERIFIED',
      confidence: 0,
      reasoning: 'No source excerpt available to verify against',
    };
  }

  const model = getExtractionModel();
  const prompt = `${VERIFICATION_PROMPT}

CLAIM TO VERIFY:
Field: ${input.claim.fieldName}
Value: ${input.claim.value}${input.claim.unit ? ` ${input.claim.unit}` : ''}

SOURCE DOCUMENT TYPE: ${input.documentSourceType}

SOURCE EXCERPT:
"""
${input.sourceExcerpt.substring(0, 2000)}
"""`;

  try {
    const result = await Promise.race([
      model.generateContent(prompt),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Verification timeout')), 20000),
      ),
    ]);

    const rawText = result.response.text();
    const parsed = parseGeminiJson<GeminiVerificationResponse>(rawText);

    if (!parsed.success) {
      logger.warn({ error: parsed.error }, 'Verification JSON parse failed — defaulting to UNVERIFIED');
      return { status: 'UNVERIFIED', confidence: 0, reasoning: 'AI response could not be parsed' };
    }

    const status = VALID_STATUSES.has(parsed.data.status) ? parsed.data.status : 'UNVERIFIED';
    const confidence = clamp(Number(parsed.data.confidence ?? 0), 0, 1);

    return {
      status,
      confidence,
      reasoning: String(parsed.data.reasoning || '').substring(0, 1000),
      supportingExcerpt: parsed.data.supportingExcerpt ?? undefined,
    };
  } catch (err) {
    logger.warn({ error: (err as Error).message }, 'Verification failed — defaulting to UNVERIFIED');
    return {
      status: 'UNVERIFIED',
      confidence: 0,
      reasoning: `Verification error: ${(err as Error).message}`,
    };
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
