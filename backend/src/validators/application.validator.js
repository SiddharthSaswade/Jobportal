import { body, query } from 'express-validator';
import { APPLICATION_STATUSES } from '../constants.js';
import { paginationRules } from './common.validator.js';

export const applyRules = [
  body('coverLetter')
    .optional({ checkFalsy: true })
    .isString()
    .withMessage('Cover letter must be a string')
    .bail()
    .isLength({ max: 2000 })
    .withMessage('Cover letter cannot exceed 2000 characters'),
];

export const statusRules = [
  body('status')
    .isIn(APPLICATION_STATUSES)
    .withMessage(`Status must be one of: ${APPLICATION_STATUSES.join(', ')}`),
];

export const applicantQueryRules = [
  ...paginationRules,
  query('status').optional().isIn(APPLICATION_STATUSES).withMessage('Invalid status filter'),
];
