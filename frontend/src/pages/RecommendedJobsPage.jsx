import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getErrorMessage } from '../api/client.js';
import { matchService } from '../api/services.js';
import ApplyButton from '../components/ApplyButton.jsx';
import EmptyState from '../components/EmptyState.jsx';
import JobCard from '../components/JobCard.jsx';
import useApplicationStatuses from '../hooks/useApplicationStatuses.js';

export default function RecommendedJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [needsResume, setNeedsResume] = useState(false);
  const { statuses, setStatus } = useApplicationStatuses();

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setNeedsResume(false);

    matchService
      .recommended({ limit: 10 }, { signal: controller.signal })
      .then(({ data }) => setJobs(data.data.jobs))
      .catch((requestError) => {
        if (controller.signal.aborted) return;
        const message = getErrorMessage(requestError);
        setError(message);
        setNeedsResume(/resume/i.test(message));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Recommended for you</h1>
          <p className="mt-1 text-sm text-slate-500">
            Open roles ranked by the skills detected in your resume.
          </p>
        </div>
        <Link
          to="/resume"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Edit resume
        </Link>
      </div>

      <div className="mt-7">
        {loading && <p className="text-sm text-slate-500">Scoring jobs…</p>}

        {error && !needsResume && (
          <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {needsResume && (
          <EmptyState
            title="Add your resume first"
            description="Once we know your skills, we can rank open jobs for you."
            actionLabel="Add resume"
            actionTo="/resume"
          />
        )}

        {!loading && !error && jobs.length === 0 && (
          <EmptyState
            title="No open roles yet"
            description="Check back soon, or browse all jobs in the meantime."
            actionLabel="Browse jobs"
            actionTo="/jobs"
          />
        )}

        {!loading && !error && jobs.length > 0 && (
          <>
            <p className="mb-4 text-sm text-slate-500">
              {jobs.length} role{jobs.length === 1 ? '' : 's'} matched, best fit first
            </p>
            <div className="grid gap-4 lg:grid-cols-2">
              {jobs.map((job) => (
                <JobCard
                  key={job._id}
                  job={job}
                  match={job.match}
                  footer={
                    <ApplyButton
                      jobId={job._id}
                      deadline={job.deadline}
                      applicationStatus={statuses[job._id]}
                      onApplied={setStatus}
                    />
                  }
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
