import { Router } from 'express';
import {
  applyToJob,
  getApplicantsForJob,
  getMyApplicationStatuses,
  getMyApplications,
  getRankedApplicants,
  updateApplicationStatus,
} from '../controllers/application.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { requireApplicationOwner } from '../middleware/applicationOwner.middleware.js';
import { requireJobOwner } from '../middleware/jobOwner.middleware.js';
import { matchLimiter } from '../middleware/rateLimit.middleware.js';
import { validate } from '../middleware/validate.js';
import {
  applicantQueryRules,
  applyRules,
  statusRules,
} from '../validators/application.validator.js';
import { mongoIdParam, paginationRules } from '../validators/common.validator.js';
import { rankRules } from '../validators/resume.validator.js';

const router = Router();

router.use(protect);

router.post('/job/:jobId', restrictTo('candidate'), mongoIdParam('jobId'), ...applyRules, validate, applyToJob);
router.get('/statuses', restrictTo('candidate'), getMyApplicationStatuses);
router.get('/mine', restrictTo('candidate'), paginationRules, validate, getMyApplications);
router.get(
  '/job/:jobId/ranked',
  restrictTo('recruiter'),
  matchLimiter,
  mongoIdParam('jobId'),
  rankRules,
  validate,
  requireJobOwner('jobId'),
  getRankedApplicants
);
router.get(
  '/job/:jobId',
  restrictTo('recruiter'),
  mongoIdParam('jobId'),
  applicantQueryRules,
  validate,
  requireJobOwner('jobId'),
  getApplicantsForJob
);
router.patch(
  '/:id/status',
  restrictTo('recruiter'),
  mongoIdParam(),
  statusRules,
  validate,
  requireApplicationOwner,
  updateApplicationStatus
);

export default router;
