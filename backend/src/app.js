import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { connectDB } from './config/db.js';
import { env, isProduction } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { apiLimiter, authLimiter } from './middleware/rateLimit.middleware.js';
import apiRoutes from './routes/index.js';

const app = express();

// Platforms like Render, Railway and nginx terminate TLS before our app.
// Trusting one proxy makes req.ip correct, which rate limiting depends on.
if (isProduction) {
  app.set('trust proxy', 1);
}

// Security headers (X-Content-Type-Options, X-Frame-Options, HSTS, etc.).
app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin(origin, callback) {
      // Non-browser clients (health checks, server-to-server) have no Origin.
      if (
        !origin ||
        env.corsOrigins.includes(origin) ||
        (env.allowVercelPreviews && /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin))
      ) {
        callback(null, true);
        return;
      }
      // Sending false omits CORS headers; the browser blocks the response.
      callback(null, false);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Vercel uses src/app.js as the Express entry point, so server.js (and its
// connectDB call) never runs there. Connect lazily on the first request and
// reuse the promise afterwards. Locally this is a no-op once server.js has
// connected, because connectDB() checks the current connection state.
let dbReady;
app.use(async (_req, _res, next) => {
  try {
    dbReady ??= connectDB().catch((error) => {
      dbReady = null;
      throw error;
    });
    await dbReady;
    next();
  } catch (error) {
    next(error);
  }
});

app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);

app.use('/api', apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
