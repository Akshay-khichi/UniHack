import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const clientPool: GoogleGenAI[] = [];
let nextClientIndex = 0;

function getAllApiKeys(): string[] {
  const candidates = [
    process.env.GEMINI_API_KEY || env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2 || env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3 || env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4 || env.GEMINI_API_KEY_4,
  ];

  const validKeys: string[] = [];
  for (const c of candidates) {
    if (typeof c === 'string') {
      const trimmed = c.trim();
      if (trimmed && trimmed.length > 0 && trimmed !== 'YOUR_GEMINI_API_KEY_HERE' && !validKeys.includes(trimmed)) {
        validKeys.push(trimmed);
      }
    }
  }
  return validKeys;
}

export function configureGemini(): void {
  clientPool.length = 0;
  const keys = getAllApiKeys();
  if (keys.length === 0) {
    logger.warn('No GEMINI_API_KEY configured — AI features will be unavailable');
    return;
  }
  for (const k of keys) {
    clientPool.push(new GoogleGenAI({ apiKey: k }));
  }
  logger.info({ keyCount: clientPool.length }, 'Gemini configured with multi-key pool (@google/genai SDK)');
}

export function isGeminiConfigured(): boolean {
  if (clientPool.length === 0) {
    configureGemini();
  }
  return clientPool.length > 0;
}

export function getAiClient(): GoogleGenAI {
  if (clientPool.length === 0) {
    configureGemini();
  }
  if (clientPool.length === 0) throw new Error('Gemini not configured — GEMINI_API_KEY missing');
  const client = clientPool[nextClientIndex % clientPool.length];
  nextClientIndex = (nextClientIndex + 1) % clientPool.length;
  return client;
}

export interface ExtractionModelWrapper {
  generateContent(prompt: string): Promise<{ response: { text: () => string } }>;
}

export function getExtractionModel(modelName = 'gemini-flash-lite-latest'): ExtractionModelWrapper {
  return {
    async generateContent(prompt: string) {
      if (clientPool.length === 0) configureGemini();
      if (clientPool.length === 0) throw new Error('Gemini not configured — GEMINI_API_KEY missing');

      let lastError: any = null;
      // Try round-robin with automatic failover across all pool clients
      for (let attempt = 0; attempt < clientPool.length; attempt++) {
        const client = getAiClient();
        try {
          const result = await client.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              temperature: 0.1,
              maxOutputTokens: 8192,
            },
          });
          return {
            response: {
              text: () => result.text ?? '',
            },
          };
        } catch (err) {
          lastError = err;
          logger.warn({ error: (err as Error).message }, 'Gemini key attempt failed, rotating to next key in pool');
        }
      }
      throw lastError;
    },
  };
}

export function getEmbeddingModel(modelName = 'text-embedding-004') {
  const ai = getAiClient();
  return {
    async embedContent(content: string) {
      const result = await ai.models.embedContent({
        model: modelName,
        contents: content,
      });
      const values = (result as any).embedding?.values || (result as any).embeddings?.[0]?.values || [];
      return {
        embedding: {
          values,
        },
      };
    },
  };
}
