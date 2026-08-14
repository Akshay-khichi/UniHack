import { Router } from 'express';
import { upload } from '../middleware/upload';
import { uploadDocument, listDocuments } from '../controllers/documentController';

const router = Router({ mergeParams: true });

router.post('/:id/documents', upload.single('file'), uploadDocument);
router.get('/:id/documents', listDocuments);

export default router;
