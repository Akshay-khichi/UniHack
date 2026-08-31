import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

async function testAllFourKeys() {
  const keys = [
    { name: 'KEY 1 (GEMINI_API_KEY)', key: process.env.GEMINI_API_KEY },
    { name: 'KEY 2 (GEMINI_API_KEY_2)', key: process.env.GEMINI_API_KEY_2 },
    { name: 'KEY 3 (GEMINI_API_KEY_3)', key: process.env.GEMINI_API_KEY_3 },
    { name: 'KEY 4 (GEMINI_API_KEY_4)', key: process.env.GEMINI_API_KEY_4 },
  ];

  for (const k of keys) {
    if (!k.key) {
      console.log(`[TEST] ${k.name}: MISSING`);
      continue;
    }
    try {
      const ai = new GoogleGenAI({ apiKey: k.key.trim() });
      const res = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: 'Return JSON: {"status": "ok"}',
        config: { temperature: 0.1, maxOutputTokens: 100 }
      });
      console.log(`[TEST] ${k.name}: SUCCESS -> ${res.text?.trim()}`);
    } catch (err: any) {
      console.log(`[TEST] ${k.name}: ERROR -> ${err.message?.slice(0, 120)}`);
    }
  }
}

testAllFourKeys().catch(console.error);
