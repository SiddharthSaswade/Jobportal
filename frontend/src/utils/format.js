export function formatSalary(min, max) {
  const lower = Number(min) || 0;
  const upper = Number(max) || 0;

  if (!lower && !upper) return 'Not disclosed';
  if (lower && upper && lower !== upper) {
    return `₹${lower.toLocaleString('en-IN')} – ₹${upper.toLocaleString('en-IN')}`;
  }
  return `₹${(upper || lower).toLocaleString('en-IN')}`;
}

export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function toDateTimeLocal(value) {
  if (!value) return '';
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export function skillsToInput(skills) {
  return Array.isArray(skills) ? skills.join(', ') : '';
}

export function inputToSkills(value) {
  return String(value)
    .split(',')
    .map((skill) => skill.trim())
    .filter(Boolean);
}
