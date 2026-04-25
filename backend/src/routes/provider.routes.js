import express from 'express';
import { getMyProfile, updateMyProfile } from '../controllers/provider.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect, authorize('provider'));

router.get('/profile', getMyProfile);
router.put('/profile', updateMyProfile);

export default router;
