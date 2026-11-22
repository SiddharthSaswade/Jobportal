import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Each test starts with an empty DOM and an empty token store, so a session
// persisted by one test can never leak into the next one.
afterEach(() => {
  cleanup();
  localStorage.clear();
});
