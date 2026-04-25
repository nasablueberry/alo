import express from 'express';
import { body } from 'express-validator';
import { registerStudent, registerProvider, login, getMe } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.post(
  '/register/student',
  [
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('birthCertificateId').notEmpty(),
    body('fullName').notEmpty(),
    body('district').notEmpty(),
    body('upazila').notEmpty(),
    body('institutionName').notEmpty(),
    body('householdIncome').isNumeric(),
  ],
  validate,
  registerStudent
);

router.post(
  '/register/provider',
  [
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('organizationName').notEmpty(),
    body('type').isIn(['ngo', 'bank', 'government', 'private']),
  ],
  validate,
  registerProvider
);

router.post('/login', [body('email').isEmail(), body('password').notEmpty()], validate, login);
router.get('/me', protect, getMe);

export default router;
