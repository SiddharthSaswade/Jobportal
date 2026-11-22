import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

export function validate(req, _res, next) {
  const errors = validationResult(req);

  if (errors.isEmpty()) return next();

  const details = errors.array().map((error) => ({
    field: error.path || error.param,
    message: error.msg,
  }));

  next(new ApiError(400, 'Validation failed', details));
}
