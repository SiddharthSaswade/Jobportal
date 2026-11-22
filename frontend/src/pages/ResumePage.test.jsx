import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { resumeService } from '../api/services.js';
import { extractResumeText } from '../utils/resumeFile.js';
import ResumePage from './ResumePage.jsx';

vi.mock('../api/services.js', () => ({
  resumeService: { get: vi.fn(), save: vi.fn(), remove: vi.fn() },
}));

vi.mock('../utils/resumeFile.js', () => ({
  extractResumeText: vi.fn(),
  MIN_TEXT_CHARS: 50,
  MAX_TEXT_CHARS: 20000,
  RESUME_ACCEPT: '.pdf,.docx,.jpg,.png,.txt',
}));

const LONG_TEXT =
  'Asha Sharma is a frontend developer with 5 years of experience building web apps with React and Node.js.';

function renderPage() {
  return render(
    <MemoryRouter>
      <ResumePage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  resumeService.get.mockResolvedValue({ data: { data: { resume: {} } } });
  resumeService.save.mockResolvedValue({
    data: {
      data: {
        resume: {
          skills: ['React'],
          yearsExperience: 5,
          updatedAt: new Date().toISOString(),
        },
      },
    },
  });
  extractResumeText.mockResolvedValue({ text: LONG_TEXT, fileName: 'asha.pdf' });
});

describe('ResumePage upload', () => {
  it('extracts and saves a PDF immediately instead of only filling the box', async () => {
    renderPage();

    const input = await screen.findByLabelText(/Upload a resume/i);
    const file = new File(['not really a pdf'], 'asha.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });

    expect(extractResumeText).toHaveBeenCalledWith(file, expect.any(Function));
    await waitFor(() =>
      expect(resumeService.save).toHaveBeenCalledWith({ text: LONG_TEXT, fileName: 'asha.pdf' })
    );
    expect(await screen.findByText(/Saved asha\.pdf/i)).toBeInTheDocument();
  });

  it('passes OCR progress through and saves a phone photo', async () => {
    extractResumeText.mockImplementation(async (selectedFile, onProgress) => {
      onProgress(45);
      return { text: LONG_TEXT, fileName: 'resume-photo.jpg' };
    });
    renderPage();

    const input = await screen.findByLabelText(/Upload a resume/i);
    fireEvent.change(input, {
      target: { files: [new File(['img'], 'resume-photo.jpg', { type: 'image/jpeg' })] },
    });

    await waitFor(() =>
      expect(resumeService.save).toHaveBeenCalledWith({
        text: LONG_TEXT,
        fileName: 'resume-photo.jpg',
      })
    );
  });

  it('shows an OCR failure instead of saving broken data', async () => {
    extractResumeText.mockRejectedValue(new Error('Could not read the text in that image.'));
    renderPage();

    const input = await screen.findByLabelText(/Upload a resume/i);
    fireEvent.change(input, {
      target: { files: [new File(['img'], 'blurry.jpg', { type: 'image/jpeg' })] },
    });

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not read the text');
    expect(resumeService.save).not.toHaveBeenCalled();
  });

  it('still lets a candidate paste text and press Save', async () => {
    renderPage();

    const textarea = await screen.findByLabelText(/Or paste resume text/i);
    fireEvent.change(textarea, { target: { value: LONG_TEXT } });
    fireEvent.click(screen.getByRole('button', { name: /Save resume/i }));

    await waitFor(() =>
      expect(resumeService.save).toHaveBeenCalledWith({ text: LONG_TEXT, fileName: '' })
    );
  });
});
