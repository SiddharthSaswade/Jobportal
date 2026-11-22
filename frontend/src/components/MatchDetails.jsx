import MatchScore from './MatchScore.jsx';

function SkillList({ title, skills, tone }) {
  if (!skills?.length) return null;

  const color =
    tone === 'missing'
      ? 'border-red-200 bg-red-50 text-red-700'
      : 'border-emerald-200 bg-emerald-50 text-emerald-700';

  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h4>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {skills.map((skill) => (
          <span key={skill} className={`rounded border px-2 py-0.5 text-xs ${color}`}>
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function MatchDetails({ match }) {
  if (!match) return null;

  return (
    <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50/40 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Resume match breakdown</h3>
          <p className="mt-1 text-xs text-slate-500">
            Scored by the {match.provider === 'openai' ? 'AI model' : 'local skill matcher'}
            {match.fallbackReason ? ` (model unavailable: ${match.fallbackReason})` : ''}
          </p>
        </div>
        <MatchScore match={match} />
      </div>

      <p className="mt-4 text-sm leading-relaxed text-slate-700">{match.explanation}</p>

      <div className="mt-5 space-y-3">
        {match.breakdown?.map((item) => (
          <div key={item.factor}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700">{item.factor}</span>
              <span className="text-slate-500">
                {item.score}/{item.max}
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-indigo-500"
                style={{ width: `${item.max ? (item.score / item.max) * 100 : 0}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">{item.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <SkillList title="Matched skills" skills={match.matchedSkills} tone="matched" />
        <SkillList title="Missing skills" skills={match.missingSkills} tone="missing" />
      </div>

      {match.extractedSkills?.length > 0 && (
        <p className="mt-5 border-t border-indigo-100 pt-4 text-xs text-slate-500">
          <span className="font-medium text-slate-600">Detected in your resume: </span>
          {match.extractedSkills.join(', ')}
        </p>
      )}
    </div>
  );
}
