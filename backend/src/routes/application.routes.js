import express from 'express';
import {
  startApplication,
  updateDraft,
  uploadApplicationDocument,
  submitApplication,
  getMyApplications,
  getApplicationById,
  getByProgram,
  getProviderRejections,
  approveOrReject,
  checkEligibilityForProgram,
} from '../controllers/application.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { upload } from '../config/multer.js';

const router = express.Router();

router.use(protect);

router.post('/start', authorize('student'), startApplication);
router.get('/my', authorize('student'), getMyApplications);
router.get('/my/:id', authorize('student'), getApplicationById);
router.put('/:id/draft', authorize('student'), updateDraft);
router.post('/:id/documents', authorize('student'), upload.single('document'), uploadApplicationDocument);
router.post('/:id/submit', authorize('student'), submitApplication);
router.get('/eligibility/:programId', authorize('student'), checkEligibilityForProgram);

router.get('/program/:programId', authorize('provider'), getByProgram);
router.get('/provider/rejections', authorize('provider'), getProviderRejections);
router.put('/:id/review', authorize('provider'), approveOrReject);

export default router;
