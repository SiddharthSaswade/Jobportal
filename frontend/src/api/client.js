import axios from 'axios';
import { TOKEN_STORAGE_KEY } from '../constants.js';

// Emitted when the API rejects a token so AuthContext can clear the session.
// ProtectedRoute then redirects the user to /login on the next render.
export const UNAUTHORIZED_EVENT = 'jobportal:unauthorized';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isLoginAttempt = url.startsWith('/auth/login') || url.startsWith('/auth/register');

    // A 401 on any other endpoint means the saved token expired or is invalid.
    // Clear it immediately instead of leaving a broken session until page reload.
    if (error.response?.status === 401 && !isLoginAttempt) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
      }
    }

    return Promise.reject(error);
  }
);

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
