import 'dotenv/config';
import { getExtractionModel, isGeminiConfigured } from '../src/config/gemini';

async function testGeminiIntegration() {
  console.log('VERIFYING GEMINI INTEGRATION VIA @google/genai SDK');
  console.log('isGeminiConfigured():', isGeminiConfigured());

  const model = getExtractionModel();
  console.log('Sending test prompt to Gemini via getExtractionModel()...');
  const start = Date.now();
  const res = await model.generateContent('Respond with exact JSON only: {"status": "ok", "message": "Gemini API integration verified"}');
  const duration = Date.now() - start;

  console.log(`\nSUCCESS: Received response in ${duration}ms:`);
  console.log('RAW OUTPUT:', res.response.text());
}

testGeminiIntegration().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
