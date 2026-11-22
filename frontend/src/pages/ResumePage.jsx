import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getErrorMessage, getValidationMessages } from '../api/client.js';
import { resumeService } from '../api/services.js';
import { INPUT_CLASS } from '../constants.js';
import { formatDate } from '../utils/format.js';
import {
  extractResumeText,
  MAX_TEXT_CHARS,
  MIN_TEXT_CHARS,
  RESUME_ACCEPT,
} from '../utils/resumeFile.js';

export default function ResumePage() {
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState('');
  const [skills, setSkills] = useState([]);
  const [yearsExperience, setYearsExperience] = useState(0);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reading, setReading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;
    resumeService
      .get()
      .then(({ data }) => {
        if (!active) return;
        const resume = data.data.resume || {};
        setText(resume.text || '');
        setFileName(resume.fileName || '');
        setSkills(resume.skills || []);
        setYearsExperience(resume.yearsExperience || 0);
        setUpdatedAt(resume.updatedAt || null);
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
  }, []);

  // Shared by file upload and the Save button, so an upload really persists
  // instead of only filling the textarea.
  const persistResume = async (nextText, nextFileName) => {
    const trimmed = nextText.trim();

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { data } = await resumeService.save({ text: trimmed, fileName: nextFileName });
      const saved = data.data.resume;
      setSkills(saved.skills || []);
      setYearsExperience(saved.yearsExperience || 0);
      setUpdatedAt(saved.updatedAt);
      setSuccess(
        nextFileName
          ? `Saved ${nextFileName}. Skills were detected automatically.`
          : 'Resume saved. Skills were detected automatically.'
      );
    } catch (requestError) {
      const messages = getValidationMessages(requestError);
      setError(messages.length ? messages.join(' ') : getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset the input so picking the same file twice still fires onChange.
    event.target.value = '';
    setError('');
    setSuccess('');
    setReading(true);
    setProgress(0);

    try {
      const extracted = await extractResumeText(file, setProgress);
      setText(extracted.text);
      setFileName(extracted.fileName);
      await persistResume(extracted.text, extracted.fileName);
    } catch (fileError) {
      setError(
        fileError instanceof Error
          ? fileError.message
          : 'Could not read that file. Try pasting the text instead.'
      );
    } finally {
      setReading(false);
    }
  };

  const handleSave = (event) => {
    event.preventDefault();
    const trimmed = text.trim();

    if (trimmed.length < MIN_TEXT_CHARS) {
      setError(`Please enter at least ${MIN_TEXT_CHARS} characters.`);
      return;
    }

    persistResume(trimmed, fileName);
  };

  const handleDelete = async () => {
    if (!window.confirm('Remove your saved resume? Match scores will no longer be available.')) {
      return;
    }

    setError('');
    setSuccess('');
    try {
      await resumeService.remove();
      setText('');
      setFileName('');
      setSkills([]);
      setYearsExperience(0);
      setUpdatedAt(null);
      setSuccess('Resume removed.');
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Loading resume…</p>;
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900">My resume</h1>
      <p className="mt-1 text-sm text-slate-500">
        Upload a PDF, Word file, photo or screenshot, or paste the text below. We read it in your
        browser and detect your skills here — the file itself is never uploaded.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <form onSubmit={handleSave} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {error && (
            <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {error}
            </p>
          )}
          {success && (
            <p role="status" className="mb-4 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
              {success}
            </p>
          )}

          <label htmlFor="resume-file" className="mb-1.5 block text-sm font-medium text-slate-700">
            Upload a resume (PDF, Word, image, .txt or .md)
          </label>
          <input
            id="resume-file"
            type="file"
            accept={RESUME_ACCEPT}
            onChange={handleFile}
            disabled={reading}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100 disabled:cursor-wait disabled:opacity-60"
          />
          <p className="mt-1.5 text-xs text-slate-400">
            PDF, .docx, JPG, PNG, WebP, .txt or .md — up to 15 MB. Photos and scanned PDFs are read
            with on-device OCR.
          </p>
          {reading && (
            <p role="status" className="mt-2 text-sm text-indigo-600">
              {progress > 0 ? `Reading your file… ${progress}%` : 'Reading your file…'}
            </p>
          )}

          <div className="mt-5">
            <div className="flex items-center justify-between">
              <label htmlFor="resume-text" className="text-sm font-medium text-slate-700">
                Or paste resume text
              </label>
              <span className="text-xs text-slate-400">{text.length}/{MAX_TEXT_CHARS}</span>
            </div>
            <textarea
              id="resume-text"
              rows={14}
              maxLength={MAX_TEXT_CHARS}
              className={`${INPUT_CLASS} mt-2 font-mono text-xs leading-relaxed`}
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                setError('');
                setSuccess('');
              }}
              placeholder={'Asha Sharma — Frontend Developer\n5 years of experience building web apps with React, TypeScript and Node.js…'}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving || reading || text.trim().length < MIN_TEXT_CHARS}
              className="w-auto rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {reading ? 'Reading…' : saving ? 'Saving…' : 'Save resume'}
            </button>
            {text && (
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-lg border border-red-200 px-5 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Remove resume
              </button>
            )}
          </div>
        </form>

        <aside className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800">Detected skills</h2>
            {skills.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                Save a resume to see the skills we found.
              </p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
            <p className="mt-4 text-xs text-slate-500">
              Experience detected: <span className="font-semibold">{yearsExperience} years</span>
            </p>
            {updatedAt && (
              <p className="mt-1 text-xs text-slate-400">Saved {formatDate(updatedAt)}</p>
            )}
          </div>

          <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-5">
            <h2 className="text-sm font-bold text-slate-800">See your matches</h2>
            <p className="mt-2 text-sm text-slate-600">
              We rank open roles by how well your resume fits them.
            </p>
            <Link
              to="/jobs/recommended"
              className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              View recommended jobs →
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
