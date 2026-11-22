import api from './client.js';

export const jobService = {
  list: (params, config = {}) => api.get('/jobs', { params, ...config }),
  get: (id) => api.get(`/jobs/${id}`),
  mine: (params, config = {}) => api.get('/jobs/mine', { params, ...config }),
  create: (payload) => api.post('/jobs', payload),
  update: (id, payload) => api.patch(`/jobs/${id}`, payload),
  remove: (id) => api.delete(`/jobs/${id}`),
};

export const applicationService = {
  apply: (jobId, payload) => api.post(`/applications/job/${jobId}`, payload),
  statuses: (config = {}) => api.get('/applications/statuses', config),
  mine: (params) => api.get('/applications/mine', { params }),
  forJob: (jobId, params, config = {}) =>
    api.get(`/applications/job/${jobId}`, { params, ...config }),
  updateStatus: (id, status) => api.patch(`/applications/${id}/status`, { status }),
};

export const resumeService = {
  get: () => api.get('/resume'),
  save: (payload) => api.put('/resume', payload),
  remove: () => api.delete('/resume'),
  match: (jobId, config = {}) => api.get(`/resume/match/${jobId}`, config),
};

export const matchService = {
  recommended: (params, config = {}) => api.get('/jobs/recommended', { params, ...config }),
  rankedApplicants: (jobId, params = {}, config = {}) =>
    api.get(`/applications/job/${jobId}/ranked`, { params, ...config }),
};
