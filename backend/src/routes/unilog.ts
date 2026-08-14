import { Router } from 'express';
import { enrichSingle, enrichBatch, getUnilogSchema, runEvaluation } from '../controllers/unilogController';

const router = Router();

// Single row enrichment
router.post('/enrich', enrichSingle);

// Batch enrichment (JSON array or CSV text, ?format=csv for 252-col CSV download)
router.post('/enrich/batch', enrichBatch);

// Return the 252-column schema for reference
router.get('/schema', getUnilogSchema);

// Evaluation benchmark vs ground truth expected_output_sheet.csv
router.get('/evaluate', runEvaluation);

export default router;

