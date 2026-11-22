import { Application } from '../models/Application.js';
import { Job } from '../models/Job.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { normalizeText, scoreMatch, scoreMatchSync } from './matching/index.js';

export function resumeProfile(user) {
  const resume = user?.resume || {};
  return {
    text: normalizeText(resume.text) ? resume.text : '',
    hasResume: Boolean(resume.hasResume),
    skills: Array.isArray(resume.skills) ? resume.skills : [],
    yearsExperience: Number.isFinite(resume.yearsExperience) ? resume.yearsExperience : null,
  };
}

export function profileHasResume(profile) {
  // hasResume is authoritative for ranked lists (they never load raw text).
  // The text/skills checks keep older documents working after the upgrade.
  return (
    profile.hasResume ||
    normalizeText(profile.text).length >= 50 ||
    profile.skills.length > 0
  );
}

export async function loadCandidate(userId) {
  // resume.text is select:false, so ask for it explicitly only where needed.
  const user = await User.findById(userId).select('+resume.text');
  if (!user) {
    throw new ApiError(404, 'Candidate not found');
  }
  return user;
}

export async function matchJobForCandidate(job, userId) {
  const candidate = await loadCandidate(userId);
  const profile = resumeProfile(candidate);

  if (!profileHasResume(profile)) {
    throw new ApiError(400, 'Please add your resume before using AI matching');
  }

  const match = await scoreMatch({ job, resume: profile });
  return {
    job: { id: job._id, title: job.title, company: job.company },
    match,
  };
}

export async function recommendJobs(userId, limit = 10) {
  const candidate = await loadCandidate(userId);
  const profile = resumeProfile(candidate);

  if (!profileHasResume(profile)) {
    throw new ApiError(400, 'Please add your resume before using AI matching');
  }

  const jobs = await Job.find({ deadline: { $gte: new Date() } })
    .populate('postedBy', 'name')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const ranked = jobs
    .map((job) => ({ ...job, match: scoreMatchSync({ job, resume: profile }) }))
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, limit);

  return ranked;
}

export function rankApplicants(job, applications) {
  const ranked = applications.map((application) => {
    const candidate = application.candidate || {};
    const profile = {
      text: '',
      hasResume: Boolean(candidate.resume?.hasResume),
      skills: Array.isArray(candidate.resume?.skills) ? candidate.resume.skills : [],
      yearsExperience: Number.isFinite(candidate.resume?.yearsExperience)
        ? candidate.resume.yearsExperience
        : null,
    };

    const hasResume = profileHasResume(profile);
    return {
      ...application,
      hasResume,
      match: hasResume ? scoreMatchSync({ job, resume: profile }) : null,
    };
  });

  // Candidates without a resume go to the bottom, then sort by score.
  ranked.sort((a, b) => {
    if (a.hasResume !== b.hasResume) return a.hasResume ? -1 : 1;
    return (b.match?.score ?? -1) - (a.match?.score ?? -1);
  });

  const withResume = ranked.filter((item) => item.hasResume);
  const averageScore = withResume.length
    ? Math.round(
        withResume.reduce((sum, item) => sum + item.match.score, 0) / withResume.length
      )
    : null;

  return {
    applicants: ranked,
    summary: {
      total: ranked.length,
      withResume: withResume.length,
      averageScore,
    },
  };
}

// Used by the recruiter's ranked endpoint so it can reuse the same ownership
// middleware and status validation as the normal applicant list.
export async function findApplicants(filter, limit) {
  return Application.find(filter)
    .populate({
      path: 'candidate',
      select: 'name email resume.hasResume resume.skills resume.yearsExperience',
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}
