// The backend uses native ES modules ("type": "module" in package.json), so we
// do not need Babel. Start Jest with node --experimental-vm-modules (see the
// npm script) and it can import the application source files directly.
export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  clearMocks: true,
  testTimeout: 30000,
  verbose: true,
};
