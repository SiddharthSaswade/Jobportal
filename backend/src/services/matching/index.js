import { env } from '../../config/env.js';
import { normalizeText } from './skillLexicon.js';
import * as localProvider from './localProvider.js';
import * as openaiProvider from './openaiProvider.js';

export { extractSkills, canonicalSkill, normalizeText } from './skillLexicon.js';
export { parseYears } from './localProvider.js';

export function usesOpenAI(resume = {}) {
  return Boolean(
    env.openaiApiKey &&
      openaiProvider.isOpenAIConfigured() &&
      normalizeText(resume.text).length >= 50
  );
}

// Single candidate-facing match: use the LLM when configured, otherwise the
// built-in deterministic scorer. A provider failure never breaks the feature —
// we fall back to local scoring and tell the client why.
export async function scoreMatch({ job, resume = {} }) {
  if (!usesOpenAI(resume)) {
    return localProvider.scoreMatch({ job, resume });
  }

  try {
    return await openaiProvider.scoreMatch({ job, resume });
  } catch (error) {
    return {
      ...localProvider.scoreMatch({ job, resume }),
      provider: 'local',
      fallbackReason: error.message || 'AI provider unavailable',
    };
  }
}

// Bulk scoring (recommendations and applicant ranking) is always local:
// deterministic, free, and fast enough for a page of jobs or applications.
export function scoreMatchSync({ job, resume = {} }) {
  return localProvider.scoreMatch({ job, resume });
}
