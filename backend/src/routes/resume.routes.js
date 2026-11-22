import { Router } from 'express';
import {
  deleteResume,
  getResume,
  matchResumeToJob,
  saveResume,
} from '../controllers/resume.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { matchLimiter } from '../middleware/rateLimit.middleware.js';
import { validate } from '../middleware/validate.js';
import { mongoIdParam } from '../validators/common.validator.js';
import { resumeRules } from '../validators/resume.validator.js';

const router = Router();

router.use(protect);
router.use(restrictTo('candidate'));

router.get('/', getResume);
router.put('/', resumeRules, validate, saveResume);
router.delete('/', deleteResume);
router.get('/match/:jobId', matchLimiter, mongoIdParam('jobId'), validate, matchResumeToJob);

export default router;
