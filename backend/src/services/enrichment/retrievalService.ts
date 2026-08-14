import { CategoryKnowledge, ICategoryKnowledgeDocument } from '../../models/CategoryKnowledge';
import { generateEmbedding, cosineSimilarity } from './embeddingService';
import { logger } from '../../utils/logger';
import { PipelineStage } from 'mongoose';

const MAX_RESULTS = 10;
const SIMILARITY_THRESHOLD = 0.7;

/**
 * Retrieve category knowledge for a given product category.
 * Tries Atlas Vector Search first; falls back to exact category match.
 */
export async function retrieveCategoryKnowledge(
  category: string,
  queryText?: string,
): Promise<ICategoryKnowledgeDocument[]> {
  // Try Atlas Vector Search if we have a query text and embeddings
  if (queryText && queryText.trim()) {
    try {
      const embedding = await generateEmbedding(queryText);
      if (embedding) {
        const vectorResults = await vectorSearch(embedding, category);
        if (vectorResults.length > 0) {
          logger.debug({ category, count: vectorResults.length }, 'Vector search returned results');
          return vectorResults;
        }
      }
    } catch (err) {
      logger.warn({ error: (err as Error).message }, 'Vector search failed — using fallback');
    }
  }

  // Fallback: exact category match
  const results = await CategoryKnowledge.find({
    category: { $regex: new RegExp(`^${escapeRegex(category)}$`, 'i') },
  }).limit(MAX_RESULTS);

  return results as unknown as ICategoryKnowledgeDocument[];
}

async function vectorSearch(
  queryEmbedding: number[],
  category: string,
): Promise<ICategoryKnowledgeDocument[]> {
  // Try Atlas $vectorSearch aggregation
  const pipeline: PipelineStage[] = [
    {
      $search: {
        index: 'vector_index',
        knnBeta: {
          vector: queryEmbedding,
          path: 'embedding',
          k: MAX_RESULTS,
          filter: { category: { $regex: new RegExp(`^${escapeRegex(category)}$`, 'i') } },
        },
      },
    } as unknown as PipelineStage,
  ];

  const results = await CategoryKnowledge.aggregate(pipeline);
  return results.filter((r: Record<string, unknown>) => {
    const score = r.score as number | undefined;
    return !score || score >= SIMILARITY_THRESHOLD;
  }) as ICategoryKnowledgeDocument[];
}

/**
 * Fallback in-memory similarity search when Atlas Vector Search not available.
 */
export async function inMemorySimilaritySearch(
  queryEmbedding: number[],
  documents: Array<ICategoryKnowledgeDocument & { embedding?: number[] }>,
): Promise<ICategoryKnowledgeDocument[]> {
  return documents
    .filter((d) => d.embedding && d.embedding.length > 0)
    .map((d) => ({
      doc: d,
      similarity: cosineSimilarity(queryEmbedding, d.embedding!),
    }))
    .filter((r) => r.similarity >= SIMILARITY_THRESHOLD)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, MAX_RESULTS)
    .map((r) => r.doc);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
