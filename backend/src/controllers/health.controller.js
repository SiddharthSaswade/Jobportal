import mongoose from 'mongoose';
import { env } from '../config/env.js';

const dbStates = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
  99: 'uninitialized',
};

export function getHealth(_req, res) {
  res.status(200).json({
    success: true,
    message: 'Job Portal API is running',
    data: {
      environment: env.nodeEnv,
      uptimeSeconds: Math.round(process.uptime()),
      database: dbStates[mongoose.connection.readyState] || 'unknown',
      timestamp: new Date().toISOString(),
    },
  });
}
