export const JOB_TYPES = ['full-time', 'part-time', 'internship', 'contract'];
export const WORK_MODES = ['onsite', 'hybrid', 'remote'];
export const EXPERIENCE_LEVELS = ['fresher', 'junior', 'mid', 'senior'];
export const APPLICATION_STATUSES = ['applied', 'reviewing', 'shortlisted', 'rejected', 'hired'];

export const JOB_SORT_FIELDS = [
  'createdAt',
  '-createdAt',
  'salaryMax',
  '-salaryMax',
  'title',
  '-title',
  'deadline',
  '-deadline',
];

export const RESUME_MIN_CHARS = 50;
export const RESUME_MAX_CHARS = 20000;

export const MATCH_WEIGHTS = { skills: 60, experience: 20, title: 20 };

// Minimum years expected for each job level. Used by the local matcher to
// compare a candidate's parsed experience with the role's seniority.
export const EXPERIENCE_YEARS = { fresher: 0, junior: 1, mid: 3, senior: 5 };

export const MATCH_LIMIT_MAX = 20;
export const RANK_LIMIT_MAX = 50;

export const JOB_WRITABLE_FIELDS = [
  'title',
  'company',
  'location',
  'jobType',
  'workMode',
  'experienceLevel',
  'salaryMin',
  'salaryMax',
  'skillsRequired',
  'description',
  'deadline',
];
