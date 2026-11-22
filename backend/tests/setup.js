// Import this file FIRST in every backend test file:
//   import './setup.js';
//
// src/config/env.js reads process.env at import time, and dotenv.config()
// deliberately does not overwrite existing keys. Setting the values here
// guarantees the tests use a throwaway database and never the developer's
// real jobportal database — even if a .env file exists next to them.

process.env.NODE_ENV = 'test';
const testUri =
  process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/jobportal_test';
process.env.MONGODB_URI = testUri;
process.env.JWT_SECRET = 'test_only_secret_at_least_16_characters_long';
process.env.JWT_EXPIRES_IN = '1h';
process.env.CORS_ORIGIN = 'http://localhost:5173';
process.env.PORT = '5009';

// Matching must be deterministic and free in tests. An API key left in .env
// would otherwise route single-job matches to a paid provider.
process.env.OPENAI_API_KEY = '';
process.env.OPENAI_MODEL = 'gpt-4o-mini';
