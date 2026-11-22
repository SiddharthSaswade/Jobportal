import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applicationService } from '../api/services.js';
import { useAuth } from '../context/AuthContext.jsx';
import useApplicationStatuses from './useApplicationStatuses.js';

vi.mock('../context/AuthContext.jsx', () => ({ useAuth: vi.fn() }));
vi.mock('../api/services.js', () => ({
  applicationService: { statuses: vi.fn() },
}));

beforeEach(() => {
  useAuth.mockReturnValue({ user: { role: 'candidate' } });
  applicationService.statuses.mockResolvedValue({
    data: { data: { statuses: { 'job-1': 'rejected' } } },
  });
});

describe('useApplicationStatuses', () => {
  it('loads the candidate status map once', async () => {
    const { result } = renderHook(() => useApplicationStatuses());

    await waitFor(() => expect(result.current.statuses['job-1']).toBe('rejected'));
    expect(applicationService.statuses).toHaveBeenCalledWith(expect.any(Object));
  });

  it('does not call the candidate endpoint for recruiters', () => {
    useAuth.mockReturnValue({ user: { role: 'recruiter' } });

    renderHook(() => useApplicationStatuses());

    expect(applicationService.statuses).not.toHaveBeenCalled();
  });

  it('updates one card status without refetching', async () => {
    const { result } = renderHook(() => useApplicationStatuses());
    await waitFor(() => expect(result.current.statuses['job-1']).toBe('rejected'));

    act(() => result.current.setStatus('job-1', 'applied'));

    expect(result.current.statuses['job-1']).toBe('applied');
    expect(applicationService.statuses).toHaveBeenCalledOnce();
  });
});
