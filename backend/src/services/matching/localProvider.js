import { EXPERIENCE_YEARS, MATCH_WEIGHTS } from '../../constants.js';
import { canonicalSkillList, extractSkills, normalizeText } from './skillLexicon.js';

const TITLE_STOPWORDS = new Set(['senior', 'junior', 'mid', 'lead', 'the', 'and', 'with', 'urgent', 'hiring']);
const TITLE_GROUPS = [
  ['dev', 'developer', 'develop', 'engineer', 'engineering', 'programmer'],
  ['frontend', 'front'],
  ['backend', 'back'],
  ['fullstack', 'full'],
  ['web'],
  ['software'],
];

export function parseYears(text) {
  const source = String(text || '');
  const explicit = [...source.matchAll(/(\d{1,2})\s*\+?\s*(?:years?|yrs?)\b/gi)].map((match) =>
    Number(match[1])
  );
  const fresher = /\b(fresher|entry[\s-]?level|no experience|0 years)\b/i.test(source);

  if (explicit.length === 0) return fresher ? 0 : null;
  return Math.max(...explicit, fresher ? 0 : -1);
}

function titleTokens(title) {
  return [...new Set(
    normalizeText(title)
      .split(' ')
      .map((word) => TITLE_GROUPS.find((group) => group.includes(word))?.[0] || word)
      .filter((word) => word.length > 2 && !TITLE_STOPWORDS.has(word))
  )];
}

function tokenMatches(token, resumeWords) {
  const group = TITLE_GROUPS.find((entry) => entry.includes(token));
  if (group) return group.some((word) => resumeWords.has(word));
  return resumeWords.has(token);
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

// Written as short, plain sentences rather than a stitched-together template.
// Recruiters read this out loud, so it should sound like a person summarising
// the evidence — not like a machine listing weighted factors.
function buildExplanation({ job, matched, missing, years, requiredYears, skillsScore, titleScore }) {
  const total = matched.length + missing.length;
  const sentences = [];
  const yearWord = (value) => `${value} ${value === 1 ? 'year' : 'years'}`;

  if (total === 0) {
    sentences.push('This role has no specific skills listed, so there was nothing to compare.');
  } else if (missing.length === 0) {
    sentences.push(`You have all ${total} of the skills this role asks for.`);
  } else if (skillsScore >= MATCH_WEIGHTS.skills * 0.7) {
    sentences.push(`You have covered ${matched.length} of the ${total} skills this role asks for.`);
  } else if (skillsScore >= MATCH_WEIGHTS.skills * 0.4) {
    sentences.push(`${matched.length} of the ${total} required skills show up in your resume, which is a reasonable overlap.`);
  } else {
    sentences.push(`Only ${matched.length} of the ${total} required skills appear in your resume.`);
  }

  if (requiredYears === 0) {
    sentences.push('This is an entry-level role, so years of experience did not count for much.');
  } else if (years === null) {
    sentences.push('Your resume does not give a number of years, so that part could not be scored from it.');
  } else if (years >= requiredYears) {
    sentences.push(`${yearWord(years)} of experience clears the ${requiredYears}-year mark for a ${job.experienceLevel} role.`);
  } else {
    sentences.push(`${yearWord(years)} of experience is a little short of the ${requiredYears} years this role is looking for.`);
  }

  if (titleScore >= MATCH_WEIGHTS.title * 0.6) {
    sentences.push('The job title is close to the work you described.');
  }

  if (missing.length > 0) {
    const listed = `${missing.slice(0, 5).join(', ')}${missing.length > 5 ? ' and others' : ''}`;
    sentences.push(missing.length === 1 ? `The one gap is ${listed}.` : `The gaps are ${listed}.`);
  }

  return sentences.join(' ');
}

export function scoreMatch({ job, resume = {} }) {
  const candidateSkills = canonicalSkillList(
    resume.skills?.length ? resume.skills : extractSkills(resume.text)
  );
  const candidateSkillSet = new Set(candidateSkills);
  const requiredSkills = [...new Set(canonicalSkillList(job.skillsRequired))];

  const matched = requiredSkills.filter((skill) => candidateSkillSet.has(skill));
  const missing = requiredSkills.filter((skill) => !candidateSkillSet.has(skill));
  const skillsScore = requiredSkills.length
    ? Math.round((matched.length / requiredSkills.length) * MATCH_WEIGHTS.skills)
    : 0;

  const years = parseYears(resume.text);
  const statedYears = Number.isFinite(resume.yearsExperience) ? resume.yearsExperience : years;
  const requiredYears = EXPERIENCE_YEARS[job.experienceLevel] ?? 0;

  let expScore;
  if (requiredYears === 0) {
    expScore = MATCH_WEIGHTS.experience;
  } else if (statedYears === null) {
    expScore = Math.round(MATCH_WEIGHTS.experience * 0.4);
  } else if (statedYears >= requiredYears) {
    expScore = MATCH_WEIGHTS.experience;
  } else if (statedYears >= requiredYears - 1) {
    expScore = Math.round(MATCH_WEIGHTS.experience * 0.7);
  } else {
    expScore = Math.round(MATCH_WEIGHTS.experience * 0.4);
  }

  const tokens = titleTokens(job.title);
  const resumeWords = new Set(
    normalizeText(`${resume.text || ''} ${candidateSkills.join(' ')}`).split(' ').filter(Boolean)
  );
  const titleHits = tokens.filter((token) => tokenMatches(token, resumeWords));
  const titleScore = tokens.length
    ? Math.round((titleHits.length / tokens.length) * MATCH_WEIGHTS.title)
    : MATCH_WEIGHTS.title;

  const score = clampScore(skillsScore + expScore + titleScore);

  return {
    score,
    matchedSkills: matched,
    missingSkills: missing,
    extractedSkills: candidateSkills,
    yearsExperience: statedYears,
    breakdown: [
      {
        factor: 'Required skills',
        score: skillsScore,
        max: MATCH_WEIGHTS.skills,
        detail: `${matched.length} of ${requiredSkills.length} required skills found`,
      },
      {
        factor: 'Experience level',
        score: expScore,
        max: MATCH_WEIGHTS.experience,
        detail:
          statedYears === null
            ? `No explicit years found; expected ${requiredYears}+`
            : `${statedYears} years found; expected ${requiredYears}+`,
      },
      {
        factor: 'Role relevance',
        score: titleScore,
        max: MATCH_WEIGHTS.title,
        detail: `${titleHits.length} of ${tokens.length || 0} title terms matched`,
      },
    ],
    explanation: buildExplanation({
      job,
      matched,
      missing,
      years: statedYears,
      requiredYears,
      skillsScore,
      expScore,
      titleScore,
    }),
    provider: 'local',
    scoredAt: new Date().toISOString(),
  };
}
