import express from 'express';
import { regionalImpact, aggregation } from '../controllers/analytics.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();
router.get('/regional', protect, authorize('admin', 'provider'), regionalImpact);
router.get('/aggregation', protect, authorize('admin'), aggregation);

export default router;
