import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let aiClient: GoogleGenAI | null = null;

function getApiKey(): string | null {
  const key = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || '';
  const trimmed = key.trim();
  if (trimmed && trimmed.length > 0 && trimmed !== 'YOUR_GEMINI_API_KEY_HERE') {
    return trimmed;
  }
  return null;
}

export function configureGemini(): void {
  const apiKey = getApiKey();
  if (!apiKey) {
    logger.warn('GEMINI_API_KEY not set — AI features will be unavailable');
    return;
  }
  aiClient = new GoogleGenAI({ apiKey });
  logger.info('Gemini configured with @google/genai SDK');
}

export function isGeminiConfigured(): boolean {
  if (aiClient === null) {
    configureGemini();
  }
  return aiClient !== null;
}

export function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    configureGemini();
  }
  if (!aiClient) throw new Error('Gemini not configured — GEMINI_API_KEY missing');
  return aiClient;
}

export interface ExtractionModelWrapper {
  generateContent(prompt: string): Promise<{ response: { text: () => string } }>;
}

export function getExtractionModel(modelName = 'gemini-flash-lite-latest'): ExtractionModelWrapper {
  const ai = getAiClient();
  return {
    async generateContent(prompt: string) {
      const result = await ai.models.generateContent({
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
