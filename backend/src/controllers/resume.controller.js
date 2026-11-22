import { User } from '../models/User.js';
import { extractSkills, parseYears } from '../services/matching/index.js';
import {
  loadCandidate,
  matchJobForCandidate,
  profileHasResume,
  resumeProfile,
} from '../services/matching.service.js';
import { Job } from '../models/Job.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getResume = asyncHandler(async (req, res) => {
  const candidate = await loadCandidate(req.user._id);
  const resume = candidate.resume || {};

  res.status(200).json({
    success: true,
    data: {
      hasResume: profileHasResume(resumeProfile(candidate)),
      resume: {
        text: resume.text || '',
        fileName: resume.fileName || '',
        skills: resume.skills || [],
        yearsExperience: resume.yearsExperience || 0,
        updatedAt: resume.updatedAt || null,
      },
    },
  });
});

export const saveResume = asyncHandler(async (req, res) => {
  const { text, fileName } = req.body;

  const candidate = await loadCandidate(req.user._id);
  candidate.resume = {
    text,
    hasResume: true,
    fileName: fileName || '',
    skills: extractSkills(text),
    yearsExperience: parseYears(text) ?? 0,
    updatedAt: new Date(),
  };
  await candidate.save();

  res.status(200).json({
    success: true,
    message: 'Resume saved and skills extracted successfully',
    data: {
      resume: {
        text: candidate.resume.text,
        fileName: candidate.resume.fileName,
        skills: candidate.resume.skills,
        yearsExperience: candidate.resume.yearsExperience,
        updatedAt: candidate.resume.updatedAt,
      },
    },
  });
});

export const deleteResume = asyncHandler(async (req, res) => {
  const candidate = await loadCandidate(req.user._id);
  candidate.resume = {
    text: '',
    hasResume: false,
    fileName: '',
    skills: [],
    yearsExperience: 0,
    updatedAt: null,
  };
  await candidate.save();

  res.status(200).json({
    success: true,
    message: 'Resume removed successfully',
  });
});

export const matchResumeToJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.jobId);
  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  const data = await matchJobForCandidate(job, req.user._id);
  res.status(200).json({ success: true, data });
});
