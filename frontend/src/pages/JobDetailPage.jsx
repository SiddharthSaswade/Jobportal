import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getErrorMessage } from '../api/client.js';
import { applicationService, jobService, resumeService } from '../api/services.js';
import MatchDetails from '../components/MatchDetails.jsx';
import { INPUT_CLASS, PRIMARY_BUTTON_CLASS, ROLES } from '../constants.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDate, formatSalary } from '../utils/format.js';

const STATUS_MESSAGES = {
  applied: 'You have already applied to this job.',
  reviewing: 'Your application is being reviewed.',
  shortlisted: 'You have been shortlisted for this role.',
  hired: 'You have been hired for this role.',
};

export default function JobDetailPage() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [applySuccess, setApplySuccess] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(null);

  const [match, setMatch] = useState(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchMessage, setMatchMessage] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    jobService
      .get(id)
      .then(({ data }) => {
        if (active) setJob(data.data.job);
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
  }, [id]);

  useEffect(() => {
    if (user?.role !== ROLES.CANDIDATE) return;

    applicationService
      .statuses()
      .then(({ data }) => {
        setApplicationStatus(data.data.statuses[id] || null);
      })
      .catch(() => {
        // If this check fails, the backend duplicate guard still protects us on submit.
      });
  }, [id, user]);

  useEffect(() => {
    if (user?.role !== ROLES.CANDIDATE) return;

    let active = true;
    setMatchLoading(true);
    setMatchMessage('');

    resumeService
      .match(id)
      .then(({ data }) => {
        if (active) setMatch(data.data.match);
      })
      .catch((requestError) => {
        if (active) setMatchMessage(getErrorMessage(requestError));
      })
      .finally(() => {
        if (active) setMatchLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, user]);

  const handleApply = async (event) => {
    event.preventDefault();
    setApplying(true);
    setApplyError('');

    try {
      await applicationService.apply(id, { coverLetter: coverLetter.trim() });
      setApplySuccess(true);
      setApplicationStatus('applied');
    } catch (requestError) {
      setApplyError(getErrorMessage(requestError));
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Loading job…</p>;
  }

  if (error || !job) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {error || 'Job not found.'}{' '}
        <Link to="/jobs" className="font-semibold underline">
          Back to jobs
        </Link>
      </div>
    );
  }

  const expired = job.deadline && new Date(job.deadline).getTime() < Date.now();
  const canApply = isAuthenticated && user?.role === ROLES.CANDIDATE;

  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/jobs" className="text-sm font-medium text-indigo-600 hover:underline">
        ← Back to jobs
      </Link>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{job.title}</h1>
            <p className="mt-2 text-slate-600">
              {job.company} · {job.location}
            </p>
          </div>
          <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-semibold capitalize text-indigo-700">
            {job.experienceLevel}
          </span>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <span className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium capitalize text-slate-600">
            {job.jobType}
          </span>
          <span className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium capitalize text-slate-600">
            {job.workMode}
          </span>
          <span className="rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
            {formatSalary(job.salaryMin, job.salaryMax)}
          </span>
          <span
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${
              expired ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {expired ? 'Deadline passed' : `Apply by ${formatDate(job.deadline)}`}
          </span>
        </div>

        {job.skillsRequired?.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-slate-800">Skills required</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {job.skillsRequired.map((skill) => (
                <span
                  key={skill}
                  className="rounded border border-slate-200 px-2.5 py-1 text-xs text-slate-600"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-7 border-t border-slate-100 pt-6">
          <h2 className="text-sm font-semibold text-slate-800">About the role</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
            {job.description}
          </p>
        </div>

        {job.postedBy?.name && (
          <p className="mt-6 text-xs text-slate-500">Posted by {job.postedBy.name}</p>
        )}
      </div>

      {user?.role === ROLES.CANDIDATE && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">Your resume match</h2>
            <Link to="/resume" className="text-sm font-semibold text-indigo-600 hover:underline">
              Manage resume →
            </Link>
          </div>

          {matchLoading && <p className="mt-4 text-sm text-slate-500">Scoring your resume…</p>}

          {matchMessage && (
            <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {matchMessage}{' '}
              <Link to="/resume" className="font-semibold text-indigo-600 hover:underline">
                Add your resume
              </Link>{' '}
              to unlock this score.
            </p>
          )}

          {match && <MatchDetails match={match} />}
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Apply for this job</h2>

        {!isAuthenticated && (
          <p className="mt-3 text-sm text-slate-600">
            Please{' '}
            <Link to="/login" className="font-semibold text-indigo-600 hover:underline">
              log in
            </Link>{' '}
            as a candidate to apply.
          </p>
        )}

        {isAuthenticated && user?.role === ROLES.RECRUITER && (
          <p className="mt-3 text-sm text-slate-600">
            You are logged in as a recruiter. Switch to a candidate account to apply.
          </p>
        )}

        {canApply && applySuccess && (
          <div role="status" className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Your application was submitted successfully. Track it under My Applications.
          </div>
        )}

        {canApply && STATUS_MESSAGES[applicationStatus] && !applySuccess && (
          <div role="status" className="mt-4 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
            {STATUS_MESSAGES[applicationStatus]}
          </div>
        )}

        {canApply && expired && !applicationStatus && (
          <p className="mt-3 text-sm text-red-600">The application deadline has passed.</p>
        )}

        {canApply && !STATUS_MESSAGES[applicationStatus] && !applySuccess && !expired && (
          <form onSubmit={handleApply} className="mt-4">
            {applyError && (
              <div
                role="alert"
                className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
              >
                {applyError}
              </div>
            )}
            {applicationStatus === 'rejected' && (
              <p className="mb-3 text-sm text-slate-600">
                Your previous application was not selected. You can apply again.
              </p>
            )}
            <label
              htmlFor="coverLetter"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Cover letter (optional)
            </label>
            <textarea
              id="coverLetter"
              name="coverLetter"
              rows={5}
              maxLength={2000}
              value={coverLetter}
              onChange={(event) => setCoverLetter(event.target.value)}
              className={INPUT_CLASS}
              placeholder="Tell the recruiter why you are a good fit…"
            />
            <div className="mt-4 max-w-xs">
              <button type="submit" disabled={applying} className={PRIMARY_BUTTON_CLASS}>
                {applying
                  ? 'Submitting…'
                  : applicationStatus === 'rejected'
                    ? 'Reapply'
                    : 'Submit application'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
