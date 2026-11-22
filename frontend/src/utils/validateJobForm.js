export function validateJobForm(values) {
  const errors = {};

  if (!values.title.trim()) errors.title = 'Job title is required';
  if (!values.company.trim()) errors.company = 'Company is required';
  if (!values.location.trim()) errors.location = 'Location is required';
  if (values.description.trim().length < 20) {
    errors.description = 'Description must be at least 20 characters';
  }
  if (inputToSkillsSafe(values.skillsRequired).length === 0) {
    errors.skillsRequired = 'Add at least one skill';
  }

  const min = Number(values.salaryMin);
  const max = Number(values.salaryMax);
  if (Number.isNaN(min) || min < 0) errors.salaryMin = 'Enter a valid minimum salary';
  if (Number.isNaN(max) || max < 0) errors.salaryMax = 'Enter a valid maximum salary';
  if (!errors.salaryMin && !errors.salaryMax && max < min) {
    errors.salaryMax = 'Maximum salary must be greater than or equal to minimum';
  }

  if (values.deadline && new Date(values.deadline).getTime() <= Date.now()) {
    errors.deadline = 'Deadline must be in the future';
  }

  return errors;
}

function inputToSkillsSafe(value) {
  return String(value || '')
    .split(',')
    .map((skill) => skill.trim())
    .filter(Boolean);
}

export const hasJobErrors = (errors) => Object.keys(errors).length > 0;
