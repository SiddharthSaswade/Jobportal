const TONES = {
  strong: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
  good: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100',
  fair: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
  low: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
};

function toneFor(score) {
  if (score >= 80) return 'strong';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'low';
}

export function matchLabel(score) {
  if (score >= 80) return 'Strong match';
  if (score >= 60) return 'Good match';
  if (score >= 40) return 'Partial match';
  return 'Low match';
}

export default function MatchScore({ match, compact = false }) {
  if (!match || typeof match.score !== 'number') return null;

  const score = Math.max(0, Math.min(100, Math.round(match.score)));

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${TONES[toneFor(score)]}`}
      title={match.explanation || 'Resume match score'}
    >
      <span aria-hidden="true">✦</span>
      {score}%
      {!compact && <span className="font-medium">· {matchLabel(score)}</span>}
    </span>
  );
}
