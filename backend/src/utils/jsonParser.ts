import { logger } from './logger';

/**
 * Robustly parse JSON from a Gemini response string.
 * Handles: markdown code fences, leading/trailing text, partial outputs.
 * NEVER throws : always returns a result object with success flag.
 */
export function parseGeminiJson<T>(raw: string): { success: true; data: T } | { success: false; error: string; raw: string } {
  if (!raw || typeof raw !== 'string') {
    return { success: false, error: 'Empty or non-string response', raw: String(raw) };
  }

  let cleaned = raw.trim();

  // Strip markdown code fences: ```json ... ``` or ``` ... ```
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');

  // Try to extract the first JSON object or array
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');

  let startIdx = -1;
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
  }

  if (startIdx === -1) {
    return { success: false, error: 'No JSON object or array found in response', raw: cleaned };
  }

  cleaned = cleaned.substring(startIdx);

  // Find the matching closing bracket/brace
  const openChar = cleaned[0];
  const closeChar = openChar === '{' ? '}' : ']';
  let depth = 0;
  let endIdx = -1;

  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i] === openChar) depth++;
    else if (cleaned[i] === closeChar) {
      depth--;
      if (depth === 0) { endIdx = i; break; }
    }
  }

  if (endIdx !== -1) {
    cleaned = cleaned.substring(0, endIdx + 1);
  }

  try {
    const parsed = JSON.parse(cleaned) as T;
    return { success: true, data: parsed };
  } catch (e) {
    logger.warn({ raw: cleaned.substring(0, 200), error: (e as Error).message }, 'JSON parse failed');
    return { success: false, error: `JSON parse failed: ${(e as Error).message}`, raw: cleaned };
  }
}
