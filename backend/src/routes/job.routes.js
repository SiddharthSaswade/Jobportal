import { Router } from 'express';
import {
  createJob,
  deleteJob,
  getJobById,
  getJobs,
  getMyJobs,
  getRecommendedJobs,
  updateJob,
} from '../controllers/job.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { requireJobOwner } from '../middleware/jobOwner.middleware.js';
import { matchLimiter } from '../middleware/rateLimit.middleware.js';
import { validate } from '../middleware/validate.js';
import { mongoIdParam, paginationRules } from '../validators/common.validator.js';
import { createJobRules, jobQueryRules, updateJobRules } from '../validators/job.validator.js';
import { recommendationRules } from '../validators/resume.validator.js';

const router = Router();

router.use(protect);

router.get('/', jobQueryRules, validate, getJobs);
router.get('/mine', restrictTo('recruiter'), paginationRules, validate, getMyJobs);
router.get(
  '/recommended',
  restrictTo('candidate'),
  matchLimiter,
  recommendationRules,
  validate,
  getRecommendedJobs
);
router.post('/', restrictTo('recruiter'), createJobRules, validate, createJob);
router.get('/:id', mongoIdParam(), validate, getJobById);
router.patch(
  '/:id',
  restrictTo('recruiter'),
  mongoIdParam(),
  ...updateJobRules,
  validate,
  requireJobOwner(),
  updateJob
);
router.delete(
  '/:id',
  restrictTo('recruiter'),
  mongoIdParam(),
  validate,
  requireJobOwner(),
  deleteJob
);

export default router;
