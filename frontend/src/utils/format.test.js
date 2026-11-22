import { describe, expect, it } from 'vitest';
import {
  formatDate,
  formatSalary,
  inputToSkills,
  skillsToInput,
} from './format.js';

describe('format helpers', () => {
  it('formats salaries in Indian grouping and handles missing values', () => {
    expect(formatSalary(0, 0)).toBe('Not disclosed');
    expect(formatSalary(500000, 900000)).toBe('₹5,00,000 – ₹9,00,000');
    expect(formatSalary(0, 800000)).toBe('₹8,00,000');
    expect(formatSalary(700000, 700000)).toBe('₹7,00,000');
  });

  it('formats dates defensively', () => {
    expect(formatDate(null)).toBe('—');

    const formatted = formatDate('2026-01-15T12:00:00Z');
    expect(formatted).toContain('2026');
    expect(formatted).toMatch(/15/);
  });

  it('round-trips skills through comma separated input', () => {
    expect(skillsToInput(['React', 'Node.js'])).toBe('React, Node.js');
    expect(skillsToInput(null)).toBe('');
    expect(inputToSkills(' React, Node.js , , ')).toEqual(['React', 'Node.js']);
  });
});
