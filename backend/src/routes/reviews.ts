import { Router } from 'express';
import { getQueue, getAllReviews, approve, edit, reject, markFieldUnverified, getVersions } from '../controllers/reviewController';

const router = Router({ mergeParams: true });

router.get('/:productId/reviews/queue', getQueue);
router.get('/:productId/reviews', getAllReviews);
router.get('/:productId/versions', getVersions);
router.post('/reviews/:reviewId/approve', approve);
router.post('/reviews/:reviewId/edit', edit);
router.post('/reviews/:reviewId/reject', reject);
router.post('/reviews/:reviewId/mark-unverified', markFieldUnverified);

export default router;
