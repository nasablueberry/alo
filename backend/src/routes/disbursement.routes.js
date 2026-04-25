import express from 'express';
import { create, listByProgram } from '../controllers/disbursement.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect, authorize('provider'));

router.post('/', create);
router.get('/program/:programId', listByProgram);

export default router;
