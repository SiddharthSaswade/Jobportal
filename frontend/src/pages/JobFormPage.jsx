import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getErrorMessage, getValidationMessages } from '../api/client.js';
import { jobService } from '../api/services.js';
import FormField from '../components/FormField.jsx';
import {
  EXPERIENCE_LEVELS,
  INPUT_CLASS,
  JOB_TYPES,
  WORK_MODES,
} from '../constants.js';
import {
  inputToSkills,
  skillsToInput,
  toDateTimeLocal,
} from '../utils/format.js';
import { hasJobErrors, validateJobForm } from '../utils/validateJobForm.js';

const EMPTY_VALUES = {
  title: '',
  company: '',
  location: '',
  description: '',
  jobType: 'full-time',
  workMode: 'onsite',
  experienceLevel: 'fresher',
  salaryMin: 0,
  salaryMax: 0,
  skillsRequired: '',
  deadline: '',
};

export default function JobFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [values, setValues] = useState(EMPTY_VALUES);
  const [errors, setErrors] = useState({});
  const [serverErrors, setServerErrors] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit) return;

    let active = true;
    jobService
      .get(id)
      .then(({ data }) => {
        if (!active) return;
        const job = data.data.job;
        setValues({
          title: job.title || '',
          company: job.company || '',
          location: job.location || '',
          description: job.description || '',
          jobType: job.jobType || 'full-time',
          workMode: job.workMode || 'onsite',
          experienceLevel: job.experienceLevel || 'fresher',
          salaryMin: job.salaryMin ?? 0,
          salaryMax: job.salaryMax ?? 0,
          skillsRequired: skillsToInput(job.skillsRequired),
          deadline: toDateTimeLocal(job.deadline),
        });
      })
      .catch((requestError) => {
        if (active) setServerErrors([getErrorMessage(requestError)]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, isEdit]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: undefined }));
    setServerErrors([]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = validateJobForm(values);
    setErrors(nextErrors);
    if (hasJobErrors(nextErrors)) return;

    const payload = {
      title: values.title.trim(),
      company: values.company.trim(),
      location: values.location.trim(),
      description: values.description.trim(),
      jobType: values.jobType,
      workMode: values.workMode,
      experienceLevel: values.experienceLevel,
      salaryMin: Number(values.salaryMin),
      salaryMax: Number(values.salaryMax),
      skillsRequired: inputToSkills(values.skillsRequired),
    };

    if (values.deadline) {
      const deadlineDate = new Date(values.deadline);
      // On edit, an already-passed deadline would fail validation; keep the existing one.
      if (deadlineDate.getTime() > Date.now() || !isEdit) {
        payload.deadline = deadlineDate.toISOString();
      }
    }

    setSubmitting(true);
    setServerErrors([]);

    try {
      let savedId = id;
      if (isEdit) {
        await jobService.update(id, payload);
      } else {
        const { data } = await jobService.create(payload);
        savedId = data.data.job._id;
      }
      navigate(`/jobs/${savedId}`, { replace: true });
    } catch (requestError) {
      const messages = getValidationMessages(requestError);
      setServerErrors(messages.length ? messages : [getErrorMessage(requestError)]);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Loading job…</p>;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/jobs/mine" className="text-sm font-medium text-indigo-600 hover:underline">
        ← Back to my jobs
      </Link>

      <h1 className="mt-5 text-2xl font-bold text-slate-900">
        {isEdit ? 'Edit job' : 'Post a new job'}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        {isEdit
          ? 'Update the details of this role.'
          : 'Fill in the details below to publish a role.'}
      </p>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        {serverErrors.length > 0 && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
          >
            <ul className="list-inside list-disc space-y-1">
              {serverErrors.map((message, index) => (
                <li key={`${message}-${index}`}>{message}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid gap-x-4 sm:grid-cols-2">
          <FormField label="Job title" htmlFor="job-title" error={errors.title}>
            <input
              id="job-title"
              name="title"
              className={INPUT_CLASS}
              value={values.title}
              onChange={handleChange}
              placeholder="Frontend Developer"
            />
          </FormField>

          <FormField label="Company" htmlFor="job-company" error={errors.company}>
            <input
              id="job-company"
              name="company"
              className={INPUT_CLASS}
              value={values.company}
              onChange={handleChange}
              placeholder="Acme Inc."
            />
          </FormField>

          <FormField label="Location" htmlFor="job-location" error={errors.location}>
            <input
              id="job-location"
              name="location"
              className={INPUT_CLASS}
              value={values.location}
              onChange={handleChange}
              placeholder="Pune"
            />
          </FormField>

          <FormField
            label="Skills (comma separated)"
            htmlFor="job-skills"
            error={errors.skillsRequired}
          >
            <input
              id="job-skills"
              name="skillsRequired"
              className={INPUT_CLASS}
              value={values.skillsRequired}
              onChange={handleChange}
              placeholder="React, Node.js, MongoDB"
            />
          </FormField>

          <FormField label="Job type" htmlFor="job-type">
            <select
              id="job-type"
              name="jobType"
              className={INPUT_CLASS}
              value={values.jobType}
              onChange={handleChange}
            >
              {JOB_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Work mode" htmlFor="job-mode">
            <select
              id="job-mode"
              name="workMode"
              className={INPUT_CLASS}
              value={values.workMode}
              onChange={handleChange}
            >
              {WORK_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Experience level" htmlFor="job-experience">
            <select
              id="job-experience"
              name="experienceLevel"
              className={INPUT_CLASS}
              value={values.experienceLevel}
              onChange={handleChange}
            >
              {EXPERIENCE_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Application deadline" htmlFor="job-deadline" error={errors.deadline}>
            <input
              id="job-deadline"
              name="deadline"
              type="datetime-local"
              className={INPUT_CLASS}
              value={values.deadline}
              onChange={handleChange}
            />
          </FormField>

          <FormField label="Minimum salary" htmlFor="job-min-salary" error={errors.salaryMin}>
            <input
              id="job-min-salary"
              name="salaryMin"
              type="number"
              min="0"
              className={INPUT_CLASS}
              value={values.salaryMin}
              onChange={handleChange}
            />
          </FormField>

          <FormField label="Maximum salary" htmlFor="job-max-salary" error={errors.salaryMax}>
            <input
              id="job-max-salary"
              name="salaryMax"
              type="number"
              min="0"
              className={INPUT_CLASS}
              value={values.salaryMax}
              onChange={handleChange}
            />
          </FormField>
        </div>

        <div className="mt-1">
          <FormField label="Description" htmlFor="job-description" error={errors.description}>
            <textarea
              id="job-description"
              name="description"
              rows={6}
              className={INPUT_CLASS}
              value={values.description}
              onChange={handleChange}
              placeholder="Describe the role, responsibilities, and requirements…"
            />
          </FormField>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {submitting
              ? isEdit
                ? 'Saving…'
                : 'Publishing…'
              : isEdit
                ? 'Save changes'
                : 'Publish job'}
          </button>
          <Link
            to="/jobs/mine"
            className="rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
