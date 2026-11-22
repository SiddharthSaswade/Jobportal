import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import api, {
  UNAUTHORIZED_EVENT,
  getErrorMessage,
  getValidationMessages,
} from './client.js';
import { TOKEN_STORAGE_KEY } from '../constants.js';

function respondWith(status) {
  return async (config) => {
    throw new AxiosError('Request failed', 'ERR_BAD_RESPONSE', config, null, {
      status,
      data: { message: 'Unauthorized' },
      config,
      headers: {},
    });
  };
}

describe('API error helpers', () => {
  it('prefers the server message, then the client message, then a fallback', () => {
    expect(getErrorMessage({ response: { data: { message: 'Job not found' } } })).toBe(
      'Job not found'
    );
    expect(getErrorMessage({ message: 'Network Error' })).toBe('Network Error');
    expect(getErrorMessage({})).toBe('Something went wrong. Please try again.');
  });

  it('flattens express-validator details into plain messages', () => {
    const error = {
      response: {
        data: {
          details: [
            { field: 'title', message: 'Title is required' },
            { field: 'company', message: 'Company is required' },
          ],
        },
      },
    };

    expect(getValidationMessages(error)).toEqual([
      'Title is required',
      'Company is required',
    ]);
    expect(getValidationMessages({ response: { data: {} } })).toEqual([]);
  });
});

describe('unauthorized response handling', () => {
  const originalAdapter = api.defaults.adapter;

  beforeEach(() => {
    localStorage.clear();
    api.defaults.adapter = originalAdapter;
  });

  it('clears the token and notifies AuthContext on a 401 from a protected route', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'expired-token');
    const onUnauthorized = vi.fn();
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    api.defaults.adapter = respondWith(401);

    await expect(api.get('/jobs')).rejects.toMatchObject({
      response: { status: 401 },
    });

    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  });

  it('keeps the token when a login attempt itself fails with 401', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'existing-token');
    const onUnauthorized = vi.fn();
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    api.defaults.adapter = respondWith(401);

    await expect(api.post('/auth/login', {})).rejects.toMatchObject({
      response: { status: 401 },
    });

    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe('existing-token');
    expect(onUnauthorized).not.toHaveBeenCalled();
    window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  });
});
