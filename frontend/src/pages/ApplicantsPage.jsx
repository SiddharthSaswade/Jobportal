import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getErrorMessage } from '../api/client.js';
import { applicationService, jobService, matchService } from '../api/services.js';
import EmptyState from '../components/EmptyState.jsx';
import MatchScore from '../components/MatchScore.jsx';
import Pagination from '../components/Pagination.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { APPLICATION_STATUSES, INPUT_CLASS } from '../constants.js';
import { formatDate } from '../utils/format.js';

export default function ApplicantsPage() {
  const { id } = useParams();

  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [summary, setSummary] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState('recent');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    let active = true;
    jobService
      .get(id)
      .then(({ data }) => {
        if (active) setJob(data.data.job);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setSummary(null);

    const statusParam = statusFilter ? { status: statusFilter } : {};

    const request =
      mode === 'match'
        ? matchService.rankedApplicants(id, { limit: 50, ...statusParam })
        : applicationService.forJob(id, { page, limit: 10, ...statusParam });

    request
      .then(({ data }) => {
        if (!active) return;
        if (mode === 'match') {
          setApplications(data.data.applicants);
          setSummary(data.data.summary);
          setPagination(null);
        } else {
          setApplications(data.data.applications);
          setPagination(data.data.pagination);
        }
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
  }, [id, page, statusFilter, mode]);

  const handleStatusChange = async (applicationId, status) => {
    setUpdatingId(applicationId);
    setError('');

    try {
      const { data } = await applicationService.updateStatus(applicationId, status);
      const updated = data.data.application;
      // Keep the match fields attached in "Best match" mode.
      setApplications((previous) =>
        previous.map((item) =>
          item._id === applicationId
            ? { ...item, ...updated, match: item.match, hasResume: item.hasResume }
            : item
        )
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(1);
  };

  return (
    <div>
      <Link to="/jobs/mine" className="text-sm font-medium text-indigo-600 hover:underline">
        ← Back to my jobs
      </Link>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Applicants</h1>
          <p className="mt-1 text-sm text-slate-500">
            {job ? `Reviewing applicants for ${job.title}` : 'Reviewing applicants'}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full max-w-[200px]">
            <label htmlFor="statusFilter" className="mb-1.5 block text-xs font-medium text-slate-600">
              Filter by status
            </label>
            <select
              id="statusFilter"
              className={INPUT_CLASS}
              value={statusFilter}
              onChange={handleFilterChange}
            >
              <option value="">All statuses</option>
              {APPLICATION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div className="flex rounded-lg border border-slate-300 p-1">
            <button
              type="button"
              onClick={() => setMode('recent')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                mode === 'recent' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Newest
            </button>
            <button
              type="button"
              onClick={() => setMode('match')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                mode === 'match' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              ✦ Best match
            </button>
          </div>
        </div>
      </div>

      {mode === 'match' && summary && (
        <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50 px-5 py-3 text-sm text-indigo-900">
          <span className="font-semibold">{summary.withResume}</span> of {summary.total} applicants
          have a resume.
          {summary.averageScore !== null && (
            <>
              {' '}Average match: <span className="font-semibold">{summary.averageScore}%</span>.
            </>
          )}{' '}
          Ranked by skills, experience, and role relevance.
        </div>
      )}

      <div className="mt-7">
        {error && (
          <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {loading && <p className="text-sm text-slate-500">Loading applicants…</p>}

        {!loading && !error && applications.length === 0 && (
          <EmptyState
            title="No applicants yet"
            description={
              statusFilter
                ? 'No applications match this status filter.'
                : 'Applications will appear here as soon as candidates apply.'
            }
          />
        )}

        {!loading &&
          !error &&
          applications.map((application) => {
            const candidate = application.candidate || {};
            return (
              <article
                key={application._id}
                className="mb-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-slate-900">
                        {candidate.name || 'Candidate'}
                      </h2>
                      {mode === 'match' &&
                        (application.match ? (
                          <MatchScore match={application.match} compact />
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                            No resume
                          </span>
                        ))}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{candidate.email || ''}</p>
                  </div>
                  <StatusBadge status={application.status} />
                </div>

                {mode === 'match' && application.match && (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {application.match.matchedSkills?.length > 0 && (
                      <span className="rounded bg-emerald-50 px-2 py-1 text-emerald-700">
                        ✓ {application.match.matchedSkills.slice(0, 5).join(', ')}
                      </span>
                    )}
                    {application.match.missingSkills?.length > 0 && (
                      <span className="rounded bg-red-50 px-2 py-1 text-red-700">
                        Missing: {application.match.missingSkills.slice(0, 5).join(', ')}
                      </span>
                    )}
                  </div>
                )}

                {application.coverLetter && (
                  <p className="mt-4 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                    <span className="font-medium text-slate-700">Cover letter: </span>
                    {application.coverLetter}
                  </p>
                )}

                <div className="mt-5 flex flex-wrap items-end justify-between gap-3 border-t border-slate-100 pt-4">
                  <p className="text-xs text-slate-500">
                    Applied on {formatDate(application.createdAt)}
                  </p>
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor={`status-${application._id}`}
                      className="text-xs font-medium text-slate-600"
                    >
                      Change status
                    </label>
                    <select
                      id={`status-${application._id}`}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500"
                      value={application.status}
                      disabled={updatingId === application._id}
                      onChange={(event) =>
                        handleStatusChange(application._id, event.target.value)
                      }
                    >
                      {APPLICATION_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </article>
            );
          })}

        {mode === 'recent' && <Pagination pagination={pagination} onPageChange={setPage} />}
      </div>
    </div>
  );
}
