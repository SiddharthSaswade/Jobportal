import { useCallback, useEffect, useState } from 'react';
import { applicationService } from '../api/services.js';
import { ROLES } from '../constants.js';
import { useAuth } from '../context/AuthContext.jsx';

// Job lists only need one small map of statuses, not every application.
// `setStatus` keeps the cards in sync immediately after an apply/reapply.
export default function useApplicationStatuses() {
  const { user } = useAuth();
  const isCandidate = user?.role === ROLES.CANDIDATE;
  const [statuses, setStatuses] = useState({});

  useEffect(() => {
    if (!isCandidate) {
      setStatuses({});
      return undefined;
    }

    const controller = new AbortController();

    applicationService
      .statuses({ signal: controller.signal })
      .then(({ data }) => {
        if (!controller.signal.aborted) setStatuses(data.data.statuses);
      })
      .catch(() => {
        // The apply button still works without this map; the backend guards
        // duplicates and only permits reapplying from a rejected status.
        if (!controller.signal.aborted) setStatuses({});
      });

    return () => controller.abort();
  }, [isCandidate]);

  const setStatus = useCallback((jobId, status) => {
    setStatuses((previous) => ({ ...previous, [jobId]: status }));
  }, []);

  return { statuses, setStatus };
}
