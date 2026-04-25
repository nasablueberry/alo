import express from 'express';
import { create, getMyPrograms, updateProgram, getOne, listPublic, rankApplicants } from '../controllers/program.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/public', listPublic);
router.get('/:id', getOne);

router.use(protect);
router.post('/', authorize('provider'), create);
router.get('/my/list', authorize('provider'), getMyPrograms);
router.put('/:id', authorize('provider'), updateProgram);
router.post('/:id/rank-applicants', authorize('provider'), rankApplicants);

export default router;
