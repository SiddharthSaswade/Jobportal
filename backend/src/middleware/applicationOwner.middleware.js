import { Application } from '../models/Application.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const requireApplicationOwner = asyncHandler(async (req, _res, next) => {
  const application = await Application.findById(req.params.id).populate({
    path: 'job',
    select: 'title postedBy',
  });

  if (!application) {
    throw new ApiError(404, 'Application not found');
  }

  if (!application.job || application.job.postedBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You can only manage applications for your own jobs');
  }

  req.application = application;
  next();
});
