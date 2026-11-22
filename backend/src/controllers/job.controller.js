import { JOB_WRITABLE_FIELDS } from '../constants.js';
import { Application } from '../models/Application.js';
import { Job } from '../models/Job.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import { buildPagination, getPaginationParams } from '../utils/paginate.js';
import { pick } from '../utils/pick.js';
import { recommendJobs } from '../services/matching.service.js';

function buildJobFilter(query) {
  const filter = {};

  if (query.keyword) {
    filter.$text = { $search: query.keyword };
  }

  if (query.location) {
    filter.location = { $regex: escapeRegex(query.location.trim()), $options: 'i' };
  }

  if (query.jobType) filter.jobType = query.jobType;
  if (query.workMode) filter.workMode = query.workMode;
  if (query.experienceLevel) filter.experienceLevel = query.experienceLevel;

  if (query.minSalary !== undefined) filter.salaryMax = { $gte: query.minSalary };
  if (query.maxSalary !== undefined) {
    filter.salaryMin = { ...(filter.salaryMin || {}), $lte: query.maxSalary };
  }

  if (query.skills) {
    const skills = query.skills
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean);

    if (skills.length > 0) {
      filter.skillsRequired = {
        $all: skills.map((skill) => new RegExp(`^${escapeRegex(skill)}$`, 'i')),
      };
    }
  }

  return filter;
}

export const createJob = asyncHandler(async (req, res) => {
  const job = await Job.create({
    ...pick(req.body, JOB_WRITABLE_FIELDS),
    postedBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: 'Job posted successfully',
    data: { job },
  });
});

export const getJobs = asyncHandler(async (req, res) => {
  const { page, limit } = getPaginationParams(req.query);
  const filter = buildJobFilter(req.query);
  const sort = req.query.sort || '-createdAt';

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .populate('postedBy', 'name')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Job.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: {
      jobs,
      pagination: buildPagination({ page, limit, total }),
    },
  });
});

export const getMyJobs = asyncHandler(async (req, res) => {
  const { page, limit } = getPaginationParams(req.query);
  const filter = { postedBy: req.user._id };

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Job.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: {
      jobs,
      pagination: buildPagination({ page, limit, total }),
    },
  });
});

export const getJobById = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).populate('postedBy', 'name');

  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  res.status(200).json({
    success: true,
    data: { job },
  });
});

export const getRecommendedJobs = asyncHandler(async (req, res) => {
  const jobs = await recommendJobs(req.user._id, req.query.limit || 10);

  res.status(200).json({
    success: true,
    data: { jobs, count: jobs.length, provider: 'local' },
  });
});

export const updateJob = asyncHandler(async (req, res) => {
  Object.assign(req.job, pick(req.body, JOB_WRITABLE_FIELDS));
  await req.job.save();
  await req.job.populate('postedBy', 'name');

  res.status(200).json({
    success: true,
    message: 'Job updated successfully',
    data: { job: req.job },
  });
});

export const deleteJob = asyncHandler(async (req, res) => {
  await Application.deleteMany({ job: req.job._id });
  await req.job.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Job and its applications were deleted successfully',
  });
});
