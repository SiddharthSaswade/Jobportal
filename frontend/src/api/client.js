import axios from 'axios';
import { TOKEN_STORAGE_KEY } from '../constants.js';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getErrorMessage(error) {
  return (
    error.response?.data?.message ||
    error.message ||
    'Something went wrong. Please try again.'
  );
}

export function getValidationMessages(error) {
  const details = error.response?.data?.details;
  return Array.isArray(details) ? details.map((item) => item.message) : [];
}

export default api;
