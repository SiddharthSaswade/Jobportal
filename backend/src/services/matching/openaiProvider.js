import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const TIMEOUT_MS = 20000;

export function isOpenAIConfigured() {
  return Boolean(env.openaiApiKey);
}

function cleanJson(content) {
  return String(content || '')
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
}

function stringList(value, limit = 25) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => String(item).trim()).filter(Boolean))].slice(0, limit);
}

function normalizeResult(parsed) {
  const score = Number(parsed?.score);
  const safeScore = Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 0;
  const summary = String(parsed?.summary || '').trim().slice(0, 500);

  return {
    score: safeScore,
    matchedSkills: stringList(parsed?.matchedSkills),
    missingSkills: stringList(parsed?.missingSkills),
    extractedSkills: [],
    yearsExperience: null,
    breakdown: [
      {
        factor: 'AI assessment',
        score: safeScore,
        max: 100,
        detail: summary || 'Model returned no written explanation.',
      },
    ],
    explanation: summary || `The AI model rated this match at ${safeScore} out of 100.`,
    provider: 'openai',
    scoredAt: new Date().toISOString(),
  };
}

// Optional LLM provider. It is only used for a single candidate-facing match;
// bulk ranking stays local so we never make N paid calls for one page.
export async function scoreMatch({ job, resume }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const systemPrompt = [
    'You are a strict, fair resume screening assistant.',
    'Compare the resume with the job details and return ONLY a JSON object.',
    'Use this exact shape: {"score": number 0-100, "matchedSkills": string[], "missingSkills": string[], "summary": string}.',
    'Score only evidence present in the resume. Do not invent skills or experience.',
    'The summary must be two sentences maximum and explain the score.',
  ].join(' ');

  const userPrompt = JSON.stringify({
    job: {
      title: job.title,
      company: job.company,
      experienceLevel: job.experienceLevel,
      skillsRequired: job.skillsRequired,
      description: String(job.description || '').slice(0, 2000),
    },
    resume: String(resume.text || '').slice(0, 12000),
  });

  try {
    const response = await fetch(OPENAI_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: env.openaiModel,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      throw new ApiError(502, `AI provider returned status ${response.status}`);
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    const parsed = JSON.parse(cleanJson(content));
    return normalizeResult(parsed);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error.name === 'AbortError') throw new ApiError(504, 'AI matching request timed out');
    throw new ApiError(502, 'AI matching service is unavailable');
  } finally {
    clearTimeout(timer);
  }
}
