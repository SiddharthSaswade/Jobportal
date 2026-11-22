import { Link } from 'react-router-dom';
import MatchScore from './MatchScore.jsx';
import { formatDate, formatSalary } from '../utils/format.js';

export default function JobCard({ job, footer, match }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            to={`/jobs/${job._id}`}
            className="text-lg font-semibold text-slate-900 hover:text-indigo-600"
          >
            {job.title}
          </Link>
          <p className="mt-1 text-sm text-slate-600">
            {job.company} · {job.location}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <MatchScore match={match} compact />
          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold capitalize text-indigo-700">
            {job.experienceLevel}
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-600">
          {job.jobType}
        </span>
        <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-600">
          {job.workMode}
        </span>
        <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
          {formatSalary(job.salaryMin, job.salaryMax)}
        </span>
      </div>

      {job.skillsRequired?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {job.skillsRequired.map((skill) => (
            <span
              key={skill}
              className="rounded border border-slate-200 px-2 py-0.5 text-xs text-slate-600"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <p className="text-xs text-slate-500">
          {job.postedBy?.name ? `Posted by ${job.postedBy.name} · ` : ''}
          Apply by {formatDate(job.deadline)}
        </p>
        {footer}
      </div>
    </article>
  );
}
