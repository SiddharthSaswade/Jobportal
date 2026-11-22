import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getErrorMessage } from '../api/client.js';
import { applicationService } from '../api/services.js';
import EmptyState from '../components/EmptyState.jsx';
import Pagination from '../components/Pagination.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { formatDate } from '../utils/format.js';

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    applicationService
      .mine({ page, limit: 10 })
      .then(({ data }) => {
        if (!active) return;
        setApplications(data.data.applications);
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">My applications</h1>
      <p className="mt-1 text-sm text-slate-500">Track every job you have applied to.</p>

      <div className="mt-7">
        {loading && <p className="text-sm text-slate-500">Loading applications…</p>}

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {!loading && !error && applications.length === 0 && (
          <EmptyState
            title="No applications yet"
            description="Browse open roles and submit your first application."
            actionLabel="Browse jobs"
            actionTo="/jobs"
          />
        )}

        {!loading &&
          !error &&
          applications.map((application) => (
            <article
              key={application._id}
              className="mb-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  {application.job ? (
                    <Link
                      to={`/jobs/${application.job._id}`}
                      className="text-lg font-semibold text-slate-900 hover:text-indigo-600"
                    >
                      {application.job.title}
                    </Link>
                  ) : (
                    <span className="text-lg font-semibold text-slate-900">Job unavailable</span>
                  )}
                  {application.job && (
                    <p className="mt-1 text-sm text-slate-600">
                      {application.job.company} · {application.job.location}
                    </p>
                  )}
                </div>
                <StatusBadge status={application.status} />
              </div>

              {application.coverLetter && (
                <p className="mt-4 whitespace-pre-wrap text-sm text-slate-600">
                  <span className="font-medium text-slate-700">Your note: </span>
                  {application.coverLetter}
                </p>
              )}

              <p className="mt-4 text-xs text-slate-500">
                Applied on {formatDate(application.createdAt)}
              </p>
            </article>
          ))}

        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>
    </div>
  );
}
