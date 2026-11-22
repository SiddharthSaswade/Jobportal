import { describe, expect, it } from 'vitest';
import { getErrorMessage, getValidationMessages } from './client.js';

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
