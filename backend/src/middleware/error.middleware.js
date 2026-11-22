import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export function notFoundHandler(req, _res, next) {
  next(new ApiError(404, `Route ${req.method} ${req.originalUrl} was not found`));
}

function normalizeError(error) {
  if (error instanceof ApiError) return error;

  if (error instanceof jwt.TokenExpiredError) {
    return new ApiError(401, 'Your session has expired. Please log in again.');
  }

  if (error instanceof jwt.JsonWebTokenError) {
    return new ApiError(401, 'Invalid token. Please log in again.');
  }

  if (error instanceof mongoose.Error.ValidationError) {
    const details = Object.values(error.errors).map((item) => ({
      field: item.path,
      message: item.message,
    }));
    return new ApiError(400, 'Validation failed', details);
  }

  if (error instanceof mongoose.Error.CastError) {
    return new ApiError(400, `Invalid value '${error.value}' for field '${error.path}'`);
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || error.keyValue || {})[0] || 'field';
    return new ApiError(409, `Duplicate value for '${field}'. It must be unique.`);
  }

  return null;
}

export function errorHandler(error, _req, res, _next) {
  const normalized = normalizeError(error);
  let finalError = normalized;

  if (!finalError) {
    console.error(error);
    finalError = new ApiError(
      500,
      env.nodeEnv === 'production' ? 'Internal server error' : error.message || 'Internal server error'
    );
  }

  res.status(finalError.statusCode).json({
    success: false,
    status: finalError.status,
    message: finalError.message,
    ...(finalError.details?.length ? { details: finalError.details } : {}),
  });
}
