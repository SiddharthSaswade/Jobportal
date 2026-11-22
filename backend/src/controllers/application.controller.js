import { Application } from '../models/Application.js';
import { Job } from '../models/Job.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildPagination, getPaginationParams } from '../utils/paginate.js';
import { findApplicants, rankApplicants } from '../services/matching.service.js';

const APPLICANT_POPULATE = { path: 'candidate', select: 'name email role' };
const MY_APPLICATION_POPULATE = {
  path: 'job',
  select: 'title company location jobType workMode deadline skillsRequired postedBy',
};

export const applyToJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.jobId);

  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  if (job.deadline && job.deadline.getTime() < Date.now()) {
    throw new ApiError(400, 'The application deadline has passed');
  }

  const existing = await Application.findOne({
    job: job._id,
    candidate: req.user._id,
  });

  if (existing && existing.status !== 'rejected') {
    throw new ApiError(409, 'You have already applied to this job');
  }

  let application;
  let reapplied = false;

  if (existing) {
    // A rejected application is the only one a candidate may revive. Keeping
    // the same document preserves the unique job/candidate guarantee.
    existing.status = 'applied';
    existing.coverLetter = req.body.coverLetter || '';
    await existing.save();
    application = existing;
    reapplied = true;
  } else {
    try {
      application = await Application.create({
        job: job._id,
        candidate: req.user._id,
        coverLetter: req.body.coverLetter || '',
      });
    } catch (error) {
      // The unique index still protects us if two requests race.
      if (error.code === 11000) {
        throw new ApiError(409, 'You have already applied to this job');
      }
      throw error;
    }
  }

  res.status(reapplied ? 200 : 201).json({
    success: true,
    message: 'Application submitted successfully',
    data: { application, reapplied },
  });
});

// Powers the apply/reapply state on job cards without paginating through
// every application the candidate has ever made.
export const getMyApplicationStatuses = asyncHandler(async (req, res) => {
  const applications = await Application.find({ candidate: req.user._id })
    .select('job status')
    .lean();

  const statuses = Object.fromEntries(
    applications.map((application) => [application.job.toString(), application.status])
  );

  res.status(200).json({ success: true, data: { statuses } });
});

export const getMyApplications = asyncHandler(async (req, res) => {
  const { page, limit } = getPaginationParams(req.query);
  const filter = { candidate: req.user._id };

  const [applications, total] = await Promise.all([
    Application.find(filter)
      .populate(MY_APPLICATION_POPULATE)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Application.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: {
      applications,
      pagination: buildPagination({ page, limit, total }),
    },
  });
});

export const getApplicantsForJob = asyncHandler(async (req, res) => {
  const { page, limit } = getPaginationParams(req.query);
  const filter = { job: req.params.jobId };

  if (req.query.status) {
    filter.status = req.query.status;
  }

  const [applications, total] = await Promise.all([
    Application.find(filter)
      .populate(APPLICANT_POPULATE)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Application.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: {
      job: req.job.title,
      applications,
      pagination: buildPagination({ page, limit, total }),
    },
  });
});

export const getRankedApplicants = asyncHandler(async (req, res) => {
  const filter = { job: req.params.jobId };
  if (req.query.status) filter.status = req.query.status;

  const applications = await findApplicants(filter, req.query.limit || 10);
  const { applicants, summary } = rankApplicants(req.job, applications);

  res.status(200).json({
    success: true,
    data: { job: req.job.title, applicants, summary, provider: 'local' },
  });
});

export const updateApplicationStatus = asyncHandler(async (req, res) => {
  req.application.status = req.body.status;
  await req.application.save();
  await req.application.populate(APPLICANT_POPULATE);

  res.status(200).json({
    success: true,
    message: 'Application status updated successfully',
    data: { application: req.application },
  });
});
