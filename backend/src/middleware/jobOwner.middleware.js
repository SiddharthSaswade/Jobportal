import { Job } from '../models/Job.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const requireJobOwner = (paramName = 'id') =>
  asyncHandler(async (req, _res, next) => {
    const job = await Job.findById(req.params[paramName]);

    if (!job) {
      throw new ApiError(404, 'Job not found');
    }

    if (job.postedBy.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'You can only modify jobs that you posted');
    }

    req.job = job;
    next();
  });
