import { parseGeminiJson } from '../src/utils/jsonParser';

describe('parseGeminiJson', () => {
  it('parses clean JSON', () => {
    const result = parseGeminiJson<{ fields: [] }>('{"fields": []}');
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.fields).toEqual([]);
  });

  it('strips markdown code fences', () => {
    const raw = '```json\n{"fields": [{"fieldName": "pressure"}]}\n```';
    const result = parseGeminiJson<{ fields: unknown[] }>(raw);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.fields).toHaveLength(1);
  });

  it('extracts JSON from surrounding text', () => {
    const raw = 'Here is the result: {"fields": []} Thank you!';
    const result = parseGeminiJson<{ fields: unknown[] }>(raw);
    expect(result.success).toBe(true);
  });

  it('returns failure for empty input', () => {
    const result = parseGeminiJson('');
    expect(result.success).toBe(false);
  });

  it('returns failure for plain text', () => {
    const result = parseGeminiJson('I cannot process this document');
    expect(result.success).toBe(false);
  });

  it('returns failure for malformed JSON', () => {
    const result = parseGeminiJson('{invalid json}');
    expect(result.success).toBe(false);
  });

  it('handles nested objects correctly', () => {
    const raw = '```json\n{"status": "VERIFIED", "confidence": 0.9, "reasoning": "test"}\n```';
    const result = parseGeminiJson<{ status: string; confidence: number }>(raw);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('VERIFIED');
      expect(result.data.confidence).toBe(0.9);
    }
  });

  it('does not throw on null input', () => {
    expect(() => parseGeminiJson(null as any)).not.toThrow();
    const result = parseGeminiJson(null as any);
    expect(result.success).toBe(false);
  });
});
