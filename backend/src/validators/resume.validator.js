import { body, query } from 'express-validator';
import {
  APPLICATION_STATUSES,
  MATCH_LIMIT_MAX,
  RANK_LIMIT_MAX,
  RESUME_MAX_CHARS,
  RESUME_MIN_CHARS,
} from '../constants.js';

export const resumeRules = [
  body('text')
    .isString()
    .withMessage('Resume text must be a string')
    .bail()
    .trim()
    .isLength({ min: RESUME_MIN_CHARS, max: RESUME_MAX_CHARS })
    .withMessage(`Resume text must be between ${RESUME_MIN_CHARS} and ${RESUME_MAX_CHARS} characters`),
  body('fileName')
    .optional({ checkFalsy: true })
    .isString()
    .withMessage('File name must be a string')
    .bail()
    .isLength({ max: 200 })
    .withMessage('File name cannot exceed 200 characters')
    // Only the extracted text is stored; the browser handles PDF/DOCX/image
    // parsing and OCR. We record the original extension so the UI can show it.
    .matches(/\.(txt|md|pdf|docx|jpg|jpeg|png|webp|bmp)$/i)
    .withMessage('Only .txt, .md, .pdf, .docx and image files are supported'),
];

export const recommendationRules = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: MATCH_LIMIT_MAX })
    .withMessage(`Limit must be between 1 and ${MATCH_LIMIT_MAX}`)
    .toInt(),
];

export const rankRules = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: RANK_LIMIT_MAX })
    .withMessage(`Limit must be between 1 and ${RANK_LIMIT_MAX}`)
    .toInt(),
  query('status').optional().isIn(APPLICATION_STATUSES).withMessage('Invalid status filter'),
];
