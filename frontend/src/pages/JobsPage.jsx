import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getErrorMessage } from '../api/client.js';
import { jobService } from '../api/services.js';
import ApplyButton from '../components/ApplyButton.jsx';
import EmptyState from '../components/EmptyState.jsx';
import JobCard from '../components/JobCard.jsx';
import Pagination from '../components/Pagination.jsx';
import useApplicationStatuses from '../hooks/useApplicationStatuses.js';
import {
  EXPERIENCE_LEVELS,
  INPUT_CLASS,
  JOB_TYPES,
  WORK_MODES,
} from '../constants.js';

const EMPTY_FILTERS = {
  keyword: '',
  location: '',
  skills: '',
  jobType: '',
  workMode: '',
  experienceLevel: '',
  minSalary: '',
  maxSalary: '',
  sort: '-createdAt',
};

const FILTER_KEYS = Object.keys(EMPTY_FILTERS);

function filtersFromParams(searchParams) {
  const params = Object.fromEntries(searchParams);
  return Object.fromEntries(
    FILTER_KEYS.map((key) => [key, params[key] || EMPTY_FILTERS[key]])
  );
}

export default function JobsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => filtersFromParams(searchParams));
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { statuses, setStatus } = useApplicationStatuses();

  useEffect(() => {
    setFilters(filtersFromParams(searchParams));
  }, [searchParams]);

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError('');

    jobService
      .list(Object.fromEntries(searchParams), { signal: controller.signal })
      .then(({ data }) => {
        setJobs(data.data.jobs);
        setPagination(data.data.pagination);
      })
      .catch((requestError) => {
        if (controller.signal.aborted) return;
        setError(getErrorMessage(requestError));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [searchParams]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFilters((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== '')
    );
    params.page = 1;
    setSearchParams(params);
  };

  const handleClear = () => {
    setFilters(EMPTY_FILTERS);
    setSearchParams({});
  };

  const handlePageChange = (page) => {
    const params = Object.fromEntries(searchParams);
    params.page = page;
    setSearchParams(params);
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Browse jobs</h1>
          <p className="mt-1 text-sm text-slate-500">Search, filter, and find your next role.</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="keyword" className="mb-1.5 block text-xs font-medium text-slate-600">
              Keyword
            </label>
            <input
              id="keyword"
              name="keyword"
              className={INPUT_CLASS}
              value={filters.keyword}
              onChange={handleChange}
              placeholder="React, developer…"
            />
          </div>
          <div>
            <label htmlFor="location" className="mb-1.5 block text-xs font-medium text-slate-600">
              Location
            </label>
            <input
              id="location"
              name="location"
              className={INPUT_CLASS}
              value={filters.location}
              onChange={handleChange}
              placeholder="Pune"
            />
          </div>
          <div>
            <label htmlFor="skills" className="mb-1.5 block text-xs font-medium text-slate-600">
              Skills (comma separated)
            </label>
            <input
              id="skills"
              name="skills"
              className={INPUT_CLASS}
              value={filters.skills}
              onChange={handleChange}
              placeholder="React, Node.js"
            />
          </div>
          <div>
            <label htmlFor="jobType" className="mb-1.5 block text-xs font-medium text-slate-600">
              Job type
            </label>
            <select
              id="jobType"
              name="jobType"
              className={INPUT_CLASS}
              value={filters.jobType}
              onChange={handleChange}
            >
              <option value="">Any</option>
              {JOB_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="workMode" className="mb-1.5 block text-xs font-medium text-slate-600">
              Work mode
            </label>
            <select
              id="workMode"
              name="workMode"
              className={INPUT_CLASS}
              value={filters.workMode}
              onChange={handleChange}
            >
              <option value="">Any</option>
              {WORK_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="experienceLevel"
              className="mb-1.5 block text-xs font-medium text-slate-600"
            >
              Experience
            </label>
            <select
              id="experienceLevel"
              name="experienceLevel"
              className={INPUT_CLASS}
              value={filters.experienceLevel}
              onChange={handleChange}
            >
              <option value="">Any</option>
              {EXPERIENCE_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="minSalary" className="mb-1.5 block text-xs font-medium text-slate-600">
              Min salary
            </label>
            <input
              id="minSalary"
              name="minSalary"
              type="number"
              min="0"
              className={INPUT_CLASS}
              value={filters.minSalary}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="maxSalary" className="mb-1.5 block text-xs font-medium text-slate-600">
              Max salary
            </label>
            <input
              id="maxSalary"
              name="maxSalary"
              type="number"
              min="0"
              className={INPUT_CLASS}
              value={filters.maxSalary}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="sort" className="mb-1.5 block text-xs font-medium text-slate-600">
              Sort by
            </label>
            <select
              id="sort"
              name="sort"
              className={INPUT_CLASS}
              value={filters.sort}
              onChange={handleChange}
            >
              <option value="-createdAt">Newest first</option>
              <option value="createdAt">Oldest first</option>
              <option value="-salaryMax">Highest salary</option>
              <option value="salaryMax">Lowest salary</option>
              <option value="title">Title A–Z</option>
              <option value="-title">Title Z–A</option>
            </select>
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Apply filters
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Clear
          </button>
        </div>
      </form>

      <div className="mt-8">
        {loading && <p className="text-sm text-slate-500">Loading jobs…</p>}
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {!loading && !error && jobs.length === 0 && (
          <EmptyState
            title="No jobs found"
            description="Try removing a filter or searching with a broader keyword."
          />
        )}

        {!loading && !error && jobs.length > 0 && (
          <>
            <p className="mb-4 text-sm text-slate-500">
              {pagination?.total} job{pagination?.total === 1 ? '' : 's'} found
            </p>
            <div className="grid gap-4 lg:grid-cols-2">
              {jobs.map((job) => (
                <JobCard
                  key={job._id}
                  job={job}
                  footer={
                    <ApplyButton
                      jobId={job._id}
                      deadline={job.deadline}
                      applicationStatus={statuses[job._id]}
                      onApplied={setStatus}
                    />
                  }
                />
              ))}
            </div>
            <Pagination pagination={pagination} onPageChange={handlePageChange} />
          </>
        )}
      </div>
    </div>
  );
}
