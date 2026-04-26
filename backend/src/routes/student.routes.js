import express from 'express';
import { generateStudentReport,
  getMyProfile,
  updateMyProfile,
  uploadDocument,
  getScholarshipHistory,
  listMyWithdrawals,
  createWithdrawal,
} from '../controllers/student.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { upload } from '../config/multer.js';

const router = express.Router();
router.use(protect, authorize('student'));

router.get('/profile', getMyProfile);
router.put('/profile', updateMyProfile);
router.post('/documents', upload.single('document'), uploadDocument);
router.get('/scholarship-history', getScholarshipHistory);
router.get('/withdrawals', listMyWithdrawals);
router.post('/withdraw', createWithdrawal);
router.get('/report', generateStudentReport);

export default router;
