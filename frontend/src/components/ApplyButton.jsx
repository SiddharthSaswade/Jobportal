import { useState } from 'react';
import { getErrorMessage } from '../api/client.js';
import { applicationService } from '../api/services.js';
import { ROLES } from '../constants.js';
import { useAuth } from '../context/AuthContext.jsx';

// Statuses where the candidate already has an active outcome and must not be
// offered another apply action. "rejected" is deliberately absent: it is the
// one state that may be reapplied to.
const ACTIVE_STATUSES = {
  applied: { label: 'Applied ✓', className: 'bg-emerald-50 text-emerald-700' },
  reviewing: { label: 'In review', className: 'bg-blue-50 text-blue-700' },
  shortlisted: { label: 'Shortlisted', className: 'bg-emerald-50 text-emerald-700' },
  hired: { label: 'Hired', className: 'bg-indigo-50 text-indigo-700' },
};

// Quick-apply action used on job cards. It intentionally sends an empty cover
// letter; candidates who want to write one can do it on the job detail page.
export default function ApplyButton({ jobId, deadline, applicationStatus, onApplied }) {
  const { user } = useAuth();
  const [localStatus, setLocalStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (user?.role !== ROLES.CANDIDATE) return null;

  // A local change wins until the parent refreshes its status map.
  const status = localStatus ?? applicationStatus;

  const expired = deadline && new Date(deadline).getTime() < Date.now();

  if (expired || status === 'expired') {
    return (
      <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-500">
        Deadline passed
      </span>
    );
  }

  const active = ACTIVE_STATUSES[status];
  if (active) {
    return (
      <span className={`rounded-full px-3 py-2 text-xs font-semibold ${active.className}`}>
        {active.label}
      </span>
    );
  }

  const updateStatus = (next) => {
    setLocalStatus(next);
    onApplied?.(jobId, next);
  };

  const handleApply = async () => {
    setSubmitting(true);
    setError('');

    try {
      await applicationService.apply(jobId, { coverLetter: '' });
      updateStatus('applied');
    } catch (requestError) {
      const message = getErrorMessage(requestError);
      // The backend unique index is the source of truth for duplicates.
      if (/already applied/i.test(message)) {
        updateStatus('applied');
      } else {
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      {status === 'rejected' && (
        <span className="text-xs font-medium text-red-600">Rejected</span>
      )}
      <button
        type="button"
        onClick={handleApply}
        disabled={submitting}
        className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
          status === 'rejected'
            ? 'bg-slate-700 hover:bg-slate-800'
            : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
      >
        {submitting
          ? 'Submitting…'
          : status === 'rejected'
            ? 'Reapply'
            : 'Apply now'}
      </button>
      {error && (
        <span role="alert" className="max-w-[220px] text-right text-xs text-red-600">
          {error}
        </span>
      )}
    </div>
  );
}
