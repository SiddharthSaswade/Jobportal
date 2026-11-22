import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getErrorMessage } from '../api/client.js';
import { jobService } from '../api/services.js';
import EmptyState from '../components/EmptyState.jsx';
import JobCard from '../components/JobCard.jsx';
import Pagination from '../components/Pagination.jsx';

export default function MyJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    jobService
      .mine({ page, limit: 10 })
      .then(({ data }) => {
        if (!active) return;
        setJobs(data.data.jobs);
        setPagination(data.data.pagination);
      })
      .catch((requestError) => {
        if (active) setError(getErrorMessage(requestError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page]);

  const handleDelete = async (job) => {
    if (!window.confirm(`Delete "${job.title}"? Its applications will also be removed.`)) {
      return;
    }

    setDeletingId(job._id);
    setError('');

    try {
      await jobService.remove(job._id);
      setJobs((previous) => previous.filter((item) => item._id !== job._id));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setDeletingId(null);
    }
  };

  const linkClass =
    'rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100';

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My jobs</h1>
          <p className="mt-1 text-sm text-slate-500">Manage the roles you have posted.</p>
        </div>
        <Link
          to="/jobs/new"
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          + Post a job
        </Link>
      </div>

      <div className="mt-7">
        {error && (
          <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {loading && <p className="text-sm text-slate-500">Loading jobs…</p>}

        {!loading && !error && jobs.length === 0 && (
          <EmptyState
            title="No jobs posted yet"
            description="Post your first role and start receiving applications."
            actionLabel="Post a job"
            actionTo="/jobs/new"
          />
        )}

        {!loading &&
          !error &&
          jobs.map((job) => (
            <div key={job._id} className="mb-4">
              <JobCard
                job={job}
                footer={
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={`/jobs/${job._id}/applicants`}
                      className="rounded-lg bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
                    >
                      Applicants
                    </Link>
                    <Link to={`/jobs/${job._id}/edit`} className={linkClass}>
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(job)}
                      disabled={deletingId === job._id}
                      className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      {deletingId === job._id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                }
              />
            </div>
          ))}

        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>
    </div>
  );
}
