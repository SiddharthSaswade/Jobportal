import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyToken } from '../utils/token.js';

export const protect = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new ApiError(401, 'Please log in to access this route');
  }

  const decoded = verifyToken(token);

  if (!decoded?.id) {
    throw new ApiError(401, 'Invalid token. Please log in again.');
  }

  const user = await User.findById(decoded.id);

  if (!user) {
    throw new ApiError(401, 'The account for this token no longer exists');
  }

  req.user = user;
  next();
});

export const restrictTo = (...allowedRoles) => (req, _res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Please log in to access this route'));
  }

  if (!allowedRoles.includes(req.user.role)) {
    return next(
      new ApiError(403, `Access denied. Required role(s): ${allowedRoles.join(', ')}`)
    );
  }

  next();
};
