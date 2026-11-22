import mongoose from 'mongoose';
import { Application } from '../models/Application.js';
import { Job } from '../models/Job.js';
import { User } from '../models/User.js';
import { env, isProduction } from './env.js';

export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    const connection = await mongoose.connect(env.mongodbUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`MongoDB connected: ${connection.connection.host}`);

    // In development Mongoose builds indexes lazily. In production we do it
    // explicitly at startup so text search and unique constraints are ready
    // before the first request, and stale indexes are removed.
    if (isProduction) {
      await Promise.all([
        User.syncIndexes(),
        Job.syncIndexes(),
        Application.syncIndexes(),
      ]);
      console.log('MongoDB indexes synchronized');
    }

    return connection;
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    throw error;
  }
}

export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}
