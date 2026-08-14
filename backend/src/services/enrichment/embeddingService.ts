import { getEmbeddingModel, isGeminiConfigured } from '../../config/gemini';
import { logger } from '../../utils/logger';

/**
 * Generate embedding for a text string using Gemini text-embedding-004.
 * Returns null if Gemini is not configured or fails.
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!isGeminiConfigured()) return null;

  try {
    const model = getEmbeddingModel();
    const result = await model.embedContent(text.substring(0, 2048));
    return result.embedding.values;
  } catch (err) {
    logger.warn({ error: (err as Error).message }, 'Embedding generation failed');
    return null;
  }
}

/**
 * Cosine similarity between two vectors.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const mag = Math.sqrt(magA) * Math.sqrt(magB);
  return mag === 0 ? 0 : dot / mag;
}
