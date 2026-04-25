import express from 'express';
import {
  getDashboard,
  listStudents,
  getStudent,
  createStudent,
  updateStudent,
  verifyStudentDocuments,
  runAtRiskIdentification,
  listAuditLogs,
  generateReport,
  listProviders,
  getProvider,
  updateProviderByAdmin,
  updateProviderVerification,
  listApplicationsPendingDisbursement,
  createAdminDisbursement,
  getAdminRejections,
  listFlaggedApplications,
  reviewFraudFlag,
} from '../controllers/admin.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect, authorize('admin'));

router.get('/dashboard', getDashboard);
router.get('/rejections', getAdminRejections);
router.get('/students', listStudents);
router.post('/students', createStudent);
/** Static paths must be registered before /students/:id or "verify" is parsed as an id */
router.put('/students/verify', verifyStudentDocuments);
router.get('/students/:id', getStudent);
router.put('/students/:id', updateStudent);
router.post('/at-risk/run', runAtRiskIdentification);
router.get('/audit', listAuditLogs);
router.get('/reports', generateReport);
router.get('/providers', listProviders);
router.put('/providers/verify', updateProviderVerification);
router.get('/providers/:id', getProvider);
router.put('/providers/:id', updateProviderByAdmin);
router.get('/applications/pending-disbursement', listApplicationsPendingDisbursement);
router.get('/applications/flagged', listFlaggedApplications);
router.put('/applications/:id/fraud-review', reviewFraudFlag);
router.post('/disbursements', createAdminDisbursement);

export default router;

