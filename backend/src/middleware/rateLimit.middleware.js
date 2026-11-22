import rateLimit from 'express-rate-limit';
import { isProduction } from '../config/env.js';

// Rate limiting is disabled during development so Postman and browser testing
// are never throttled. It becomes active as soon as NODE_ENV=production.
const common = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: isProduction ? undefined : () => true,
};

export const authLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: {
    success: false,
    status: 429,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

export const apiLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 200,
  // Auth requests have their own stricter limiter; don't count them twice.
  skip: isProduction ? (req) => req.path.startsWith('/auth') : () => true,
  message: {
    success: false,
    status: 429,
    message: 'Too many requests. Please slow down.',
  },
});

// AI matching is more expensive than a normal read (and may call a paid API),
// so it gets a tighter limit on top of the general API budget.
export const matchLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: {
    success: false,
    status: 429,
    message: 'Too many matching requests. Please try again in a few minutes.',
  },
});
