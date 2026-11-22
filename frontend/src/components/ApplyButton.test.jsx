import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applicationService } from '../api/services.js';
import { useAuth } from '../context/AuthContext.jsx';
import ApplyButton from './ApplyButton.jsx';

vi.mock('../context/AuthContext.jsx', () => ({ useAuth: vi.fn() }));
vi.mock('../api/services.js', () => ({
  applicationService: { apply: vi.fn() },
}));

const futureDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
const pastDeadline = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

beforeEach(() => {
  useAuth.mockReturnValue({ user: { role: 'candidate' } });
  applicationService.apply.mockResolvedValue({ data: { success: true } });
});

describe('ApplyButton', () => {
  it('applies a candidate and shows the success state', async () => {
    const onApplied = vi.fn();
    render(
      <ApplyButton jobId="job-1" deadline={futureDeadline} onApplied={onApplied} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Apply now' }));

    await waitFor(() => {
      expect(applicationService.apply).toHaveBeenCalledWith('job-1', { coverLetter: '' });
    });
    expect(await screen.findByText(/Applied ✓/)).toBeInTheDocument();
    expect(onApplied).toHaveBeenCalledWith('job-1', 'applied');
  });

  it('is hidden from recruiters', () => {
    useAuth.mockReturnValue({ user: { role: 'recruiter' } });

    const { container } = render(<ApplyButton jobId="job-1" deadline={futureDeadline} />);

    expect(container).toBeEmptyDOMElement();
    expect(applicationService.apply).not.toHaveBeenCalled();
  });

  it('shows a deadline message instead of a button for expired jobs', () => {
    render(<ApplyButton jobId="job-1" deadline={pastDeadline} />);

    expect(screen.getByText('Deadline passed')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(applicationService.apply).not.toHaveBeenCalled();
  });

  it.each([
    ['applied', 'Applied ✓'],
    ['reviewing', 'In review'],
    ['shortlisted', 'Shortlisted'],
    ['hired', 'Hired'],
  ])('offers no apply action for %s', (applicationStatus, label) => {
    render(
      <ApplyButton
        jobId="job-1"
        deadline={futureDeadline}
        applicationStatus={applicationStatus}
      />
    );

    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(applicationService.apply).not.toHaveBeenCalled();
  });

  it('offers reapply for a rejected application and then shows applied', async () => {
    const onApplied = vi.fn();
    render(
      <ApplyButton
        jobId="job-1"
        deadline={futureDeadline}
        applicationStatus="rejected"
        onApplied={onApplied}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Reapply' }));

    await waitFor(() => {
      expect(applicationService.apply).toHaveBeenCalledWith('job-1', { coverLetter: '' });
    });
    expect(await screen.findByText(/Applied ✓/)).toBeInTheDocument();
    expect(onApplied).toHaveBeenCalledWith('job-1', 'applied');
  });

  it('treats a duplicate-application error as already applied', async () => {
    applicationService.apply.mockRejectedValue({
      response: { data: { message: 'You have already applied to this job' } },
    });

    render(<ApplyButton jobId="job-1" deadline={futureDeadline} />);
    fireEvent.click(screen.getByRole('button', { name: 'Apply now' }));

    expect(await screen.findByText(/Applied ✓/)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows the server message for any other failure', async () => {
    applicationService.apply.mockRejectedValue({
      response: { data: { message: 'The application deadline has passed' } },
    });

    render(<ApplyButton jobId="job-1" deadline={futureDeadline} />);
    fireEvent.click(screen.getByRole('button', { name: 'Apply now' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The application deadline has passed'
    );
  });
});
