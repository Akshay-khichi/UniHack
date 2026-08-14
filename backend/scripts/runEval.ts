import 'dotenv/config';
import { runUnilogEvaluation } from '../src/services/evaluation/unilogEvaluationService';
import { isGeminiConfigured } from '../src/config/gemini';

async function main() {
  const isConfigured = isGeminiConfigured();
  console.log('--- GEMINI API KEY STATUS ---');
  console.log('isGeminiConfigured():', isConfigured);
  console.log('process.env.GEMINI_API_KEY present:', Boolean(process.env.GEMINI_API_KEY));

  console.log('\n--- HELD-OUT VALIDATION BENCHMARK RUN (50 ROWS) ---');
  const report = await runUnilogEvaluation(50, 'held_out');

  console.log('\n--- INTERNAL SCORE CONSISTENCY VERIFICATION ---');
  for (const m of report.metrics) {
    const expectedScore = m.total > 0 ? Math.round((m.passed / m.total) * 100) : 0;
    const isConsistent = m.score === expectedScore;
    console.log(`- ${m.category}: passed=${m.passed}, total=${m.total}, score=${m.score}% (formula matched: ${isConsistent})`);
  }

  console.log('\n--- FAILED ROWS REASON LOG ---');
  const failedRows = report.benchmark_rows.filter((r) => r.enrichment_failed);
  if (failedRows.length === 0) {
    console.log('No rows failed enrichment during this run.');
  } else {
    failedRows.forEach((r, idx) => {
      console.log(`[FAILED ROW ${idx + 1}] MPN: ${r.mpn} | Reason: ${r.error_reason || 'Unknown'}`);
    });
  }

  console.log('\n--- COMPLETE RAW REPORT JSON ---');
  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error('Evaluation run error:', err);
  process.exit(1);
});
