/**
 * Extraction service tests — mocked Gemini.
 */

// Must mock before imports
jest.mock('../src/config/gemini', () => ({
  isGeminiConfigured: jest.fn(),
  getExtractionModel: jest.fn(),
}));

import { extractFromDocument } from '../src/services/extraction/extractionService';
import * as geminiConfig from '../src/config/gemini';

const mockIsConfigured = geminiConfig.isGeminiConfigured as jest.Mock;
const mockGetModel = geminiConfig.getExtractionModel as jest.Mock;

const validResponse = {
  fields: [
    {
      fieldName: 'Maximum Pressure',
      canonicalName: 'maximumPressure',
      value: 210,
      unit: 'bar',
      confidence: 0.95,
      pageNumber: 3,
      excerpt: 'Maximum operating pressure: 210 bar',
    },
  ],
  warnings: [],
};

describe('extractionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws when Gemini not configured', async () => {
    mockIsConfigured.mockReturnValue(false);
    await expect(
      extractFromDocument({ content: 'test', filename: 'test.pdf', mimeType: 'application/pdf', sourceType: 'TECHNICAL_DATASHEET' }),
    ).rejects.toThrow();
  });

  it('returns extracted fields on valid response', async () => {
    mockIsConfigured.mockReturnValue(true);
    mockGetModel.mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: { text: () => JSON.stringify(validResponse) },
      }),
    });

    const result = await extractFromDocument({
      content: 'Maximum operating pressure: 210 bar',
      filename: 'datasheet.pdf',
      mimeType: 'application/pdf',
      sourceType: 'TECHNICAL_DATASHEET',
    });

    expect(result.fields).toHaveLength(1);
    expect(result.fields[0].canonicalName).toBe('maximumPressure');
    expect(result.fields[0].value).toBe(210);
    expect(result.fields[0].unit).toBe('bar');
    expect(result.fields[0].confidence).toBe(0.95);
  });

  it('handles malformed JSON without crashing', async () => {
    mockIsConfigured.mockReturnValue(true);
    mockGetModel.mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: { text: () => 'not valid json at all' },
      }),
    });

    // Should retry 3 times and then throw ExternalServiceError
    await expect(
      extractFromDocument({
        content: 'test',
        filename: 'test.pdf',
        mimeType: 'application/pdf',
        sourceType: 'TECHNICAL_DATASHEET',
      }),
    ).rejects.toMatchObject({ code: 'EXTERNAL_SERVICE_ERROR' });
  });

  it('returns empty fields array on empty fields from AI', async () => {
    mockIsConfigured.mockReturnValue(true);
    mockGetModel.mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: { text: () => '{"fields": [], "warnings": ["No fields found"]}' },
      }),
    });

    const result = await extractFromDocument({
      content: 'irrelevant content',
      filename: 'empty.pdf',
      mimeType: 'application/pdf',
      sourceType: 'TECHNICAL_DATASHEET',
    });

    expect(result.fields).toHaveLength(0);
    expect(result.warnings).toContain('No fields found');
  });

  it('strips markdown code fences from AI response', async () => {
    mockIsConfigured.mockReturnValue(true);
    mockGetModel.mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () => `\`\`\`json\n${JSON.stringify(validResponse)}\n\`\`\``,
        },
      }),
    });

    const result = await extractFromDocument({
      content: 'test',
      filename: 'test.pdf',
      mimeType: 'application/pdf',
      sourceType: 'TECHNICAL_DATASHEET',
    });

    expect(result.fields).toHaveLength(1);
  });
});
