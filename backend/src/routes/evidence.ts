import { Router } from 'express';
import { getExtractedFields, getEvidence, startProcessing } from '../controllers/processingController';

const router = Router({ mergeParams: true });

router.post('/:id/process', startProcessing);
router.get('/:id/fields', getExtractedFields);
router.get('/:id/evidence', getEvidence);

export default router;
