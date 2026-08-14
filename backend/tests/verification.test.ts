/**
 * Verification service tests — mocked Gemini.
 */

jest.mock('../src/config/gemini', () => ({
  isGeminiConfigured: jest.fn(),
  getExtractionModel: jest.fn(),
}));

import { verifyEvidence } from '../src/services/verification/verificationService';
import * as geminiConfig from '../src/config/gemini';

const mockIsConfigured = geminiConfig.isGeminiConfigured as jest.Mock;
const mockGetModel = geminiConfig.getExtractionModel as jest.Mock;

describe('verificationService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns UNVERIFIED when Gemini not configured', async () => {
    mockIsConfigured.mockReturnValue(false);
    const result = await verifyEvidence({
      claim: { fieldName: 'maximumPressure', value: 210, unit: 'bar' },
      sourceExcerpt: 'Maximum operating pressure is 210 bar',
      documentSourceType: 'TECHNICAL_DATASHEET',
    });
    expect(result.status).toBe('UNVERIFIED');
    expect(result.confidence).toBe(0);
  });

  it('returns UNVERIFIED for empty excerpt (never invents support)', async () => {
    mockIsConfigured.mockReturnValue(true);
    const result = await verifyEvidence({
      claim: { fieldName: 'maximumPressure', value: 210, unit: 'bar' },
      sourceExcerpt: '',
      documentSourceType: 'TECHNICAL_DATASHEET',
    });
    expect(result.status).toBe('UNVERIFIED');
  });

  it('returns VERIFIED when AI confirms', async () => {
    mockIsConfigured.mockReturnValue(true);
    mockGetModel.mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            status: 'VERIFIED',
            confidence: 0.95,
            reasoning: 'Excerpt clearly states 210 bar',
            supportingExcerpt: 'Maximum operating pressure: 210 bar',
          }),
        },
      }),
    });

    const result = await verifyEvidence({
      claim: { fieldName: 'maximumPressure', value: 210, unit: 'bar' },
      sourceExcerpt: 'Maximum operating pressure: 210 bar',
      documentSourceType: 'TECHNICAL_DATASHEET',
    });

    expect(result.status).toBe('VERIFIED');
    expect(result.confidence).toBe(0.95);
  });

  it('returns UNVERIFIED on AI failure — never crashes', async () => {
    mockIsConfigured.mockReturnValue(true);
    mockGetModel.mockReturnValue({
      generateContent: jest.fn().mockRejectedValue(new Error('Network error')),
    });

    const result = await verifyEvidence({
      claim: { fieldName: 'maximumPressure', value: 210, unit: 'bar' },
      sourceExcerpt: 'Some excerpt',
      documentSourceType: 'TECHNICAL_DATASHEET',
    });

    expect(result.status).toBe('UNVERIFIED');
    expect(result.confidence).toBe(0);
  });

  it('defaults to UNVERIFIED on invalid AI status', async () => {
    mockIsConfigured.mockReturnValue(true);
    mockGetModel.mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify({ status: 'DEFINITELY_REAL', confidence: 1.0, reasoning: '' }),
        },
      }),
    });

    const result = await verifyEvidence({
      claim: { fieldName: 'test', value: 100 },
      sourceExcerpt: 'some text',
      documentSourceType: 'TECHNICAL_DATASHEET',
    });

    expect(result.status).toBe('UNVERIFIED');
  });
});
