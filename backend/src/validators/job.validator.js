import { body, query } from 'express-validator';
import {
  EXPERIENCE_LEVELS,
  JOB_SORT_FIELDS,
  JOB_TYPES,
  WORK_MODES,
} from '../constants.js';
import { paginationRules } from './common.validator.js';

const salaryMaxCheck = (value, { req }) => {
  const min = req.body.salaryMin;
  if (min !== undefined && value < Number(min)) {
    throw new Error('salaryMax must be greater than or equal to salaryMin');
  }
  return true;
};

const futureDeadlineCheck = (value) => {
  if (new Date(value).getTime() <= Date.now()) {
    throw new Error('Deadline must be in the future');
  }
  return true;
};

export const createJobRules = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Job title is required')
    .bail()
    .isLength({ min: 3, max: 100 })
    .withMessage('Job title must be between 3 and 100 characters'),
  body('company')
    .trim()
    .notEmpty()
    .withMessage('Company is required')
    .bail()
    .isLength({ max: 100 })
    .withMessage('Company cannot exceed 100 characters'),
  body('location')
    .trim()
    .notEmpty()
    .withMessage('Location is required')
    .bail()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .bail()
    .isLength({ min: 20, max: 5000 })
    .withMessage('Description must be between 20 and 5000 characters'),
  body('jobType').optional().isIn(JOB_TYPES).withMessage('Invalid job type'),
  body('workMode').optional().isIn(WORK_MODES).withMessage('Invalid work mode'),
  body('experienceLevel')
    .optional()
    .isIn(EXPERIENCE_LEVELS)
    .withMessage('Invalid experience level'),
  body('salaryMin')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('salaryMin must be a non-negative number')
    .toFloat(),
  body('salaryMax')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('salaryMax must be a non-negative number')
    .toFloat()
    .custom(salaryMaxCheck),
  body('skillsRequired')
    .isArray({ min: 1 })
    .withMessage('At least one skill is required'),
  body('skillsRequired.*')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Skills must be non-empty strings'),
  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('Deadline must be a valid ISO date')
    .toDate()
    .custom(futureDeadlineCheck),
];

export const updateJobRules = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Job title cannot be empty')
    .bail()
    .isLength({ min: 3, max: 100 })
    .withMessage('Job title must be between 3 and 100 characters'),
  body('company')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Company cannot be empty')
    .bail()
    .isLength({ max: 100 })
    .withMessage('Company cannot exceed 100 characters'),
  body('location')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Location cannot be empty')
    .bail()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters'),
  body('description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Description cannot be empty')
    .bail()
    .isLength({ min: 20, max: 5000 })
    .withMessage('Description must be between 20 and 5000 characters'),
  body('jobType').optional().isIn(JOB_TYPES).withMessage('Invalid job type'),
  body('workMode').optional().isIn(WORK_MODES).withMessage('Invalid work mode'),
  body('experienceLevel')
    .optional()
    .isIn(EXPERIENCE_LEVELS)
    .withMessage('Invalid experience level'),
  body('salaryMin')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('salaryMin must be a non-negative number')
    .toFloat(),
  body('salaryMax')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('salaryMax must be a non-negative number')
    .toFloat()
    .custom(salaryMaxCheck),
  body('skillsRequired')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one skill is required'),
  body('skillsRequired.*')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Skills must be non-empty strings'),
  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('Deadline must be a valid ISO date')
    .toDate()
    .custom(futureDeadlineCheck),
];

export const jobQueryRules = [
  ...paginationRules,
  query('keyword')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Keyword must be between 2 and 100 characters'),
  query('location')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location is too long'),
  query('skills').optional({ checkFalsy: true }).isString().withMessage('Invalid skills filter'),
  query('jobType').optional().isIn(JOB_TYPES).withMessage('Invalid job type'),
  query('workMode').optional().isIn(WORK_MODES).withMessage('Invalid work mode'),
  query('experienceLevel')
    .optional()
    .isIn(EXPERIENCE_LEVELS)
    .withMessage('Invalid experience level'),
  query('minSalary')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('minSalary must be a non-negative number')
    .toFloat(),
  query('maxSalary')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('maxSalary must be a non-negative number')
    .toFloat()
    .custom((value, { req }) => {
      if (req.query.minSalary !== undefined && value < Number(req.query.minSalary)) {
        throw new Error('maxSalary must be greater than or equal to minSalary');
      }
      return true;
    }),
  query('sort').optional().isIn(JOB_SORT_FIELDS).withMessage('Invalid sort field'),
];
