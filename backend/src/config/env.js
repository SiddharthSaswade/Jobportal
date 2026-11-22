import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

// Resolve from this file instead of process.cwd() so the app works
// when started from the repo root or from the backend folder.
dotenv.config({ path: path.resolve(currentDir, '../../.env') });

const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];

// Comma-separated so a Vercel project can allow its production domain and
// preview URLs at once. Empty entries are ignored.
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]?.trim());

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variable(s): ${missingEnvVars.join(', ')}. ` +
      'Copy .env.example to .env and fill in the values.'
  );
}

if (process.env.JWT_SECRET.trim().length < 16) {
  throw new Error('JWT_SECRET must be at least 16 characters long.');
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5001,
  mongodbUri: process.env.MONGODB_URI.trim(),
  corsOrigin: corsOrigins.join(','),
  corsOrigins,
  allowVercelPreviews: process.env.ALLOW_VERCEL_PREVIEWS === 'true',
  jwtSecret: process.env.JWT_SECRET.trim(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  // Optional. Without these, matching uses the built-in local scorer.
  openaiApiKey: process.env.OPENAI_API_KEY?.trim() || '',
  openaiModel: process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini',
};

export const isProduction = env.nodeEnv === 'production';

if (isProduction) {
  if (!process.env.CORS_ORIGIN?.trim() || env.corsOrigins.length === 0) {
    throw new Error(
      'CORS_ORIGIN must be set in production to your deployed frontend URL ' +
        '(comma-separated for multiple origins).'
    );
  }
  if (env.corsOrigin === '*') {
    throw new Error('CORS_ORIGIN must be an explicit origin in production, not "*".');
  }
}
