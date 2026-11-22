import mongoose from 'mongoose';
import request from 'supertest';
import { connectDB } from '../src/config/db.js';
import { Application } from '../src/models/Application.js';
import { Job } from '../src/models/Job.js';
import { User } from '../src/models/User.js';

export const futureDate = (days = 30) =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

export async function connectTestDB() {
  await connectDB();
  // Production synchronises indexes at startup; tests skip that path, so we do
  // it here. Job's text index is required for ?keyword= search to work.
  await Promise.all([
    User.syncIndexes(),
    Job.syncIndexes(),
    Application.syncIndexes(),
  ]);
}

export async function clearDB() {
  await Promise.all([
    Application.deleteMany({}),
    Job.deleteMany({}),
    User.deleteMany({}),
  ]);
}

export async function closeTestDB() {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
}

export const bearer = (token) => ({ Authorization: `Bearer ${token}` });

let userCounter = 0;

export async function registerUser(app, overrides = {}) {
  userCounter += 1;
  const payload = {
    name: 'Test User',
    email: `test${userCounter}_${Date.now()}@example.com`,
    password: 'Password123',
    role: 'candidate',
    ...overrides,
  };

  const response = await request(app).post('/api/auth/register').send(payload);
  return { response, payload, data: response.body.data };
}

export function validJob(overrides = {}) {
  return {
    title: 'Frontend Developer',
    company: 'Acme',
    location: 'Pune',
    description: 'Build and maintain React applications with a modern backend.',
    skillsRequired: ['React', 'Node.js'],
    experienceLevel: 'mid',
    jobType: 'full-time',
    workMode: 'hybrid',
    salaryMin: 500000,
    salaryMax: 900000,
    deadline: futureDate(),
    ...overrides,
  };
}

export async function createJob(app, token, overrides = {}) {
  const response = await request(app)
    .post('/api/jobs')
    .set(bearer(token))
    .send(validJob(overrides));

  return { response, job: response.body.data?.job };
}

export function applyToJob(app, token, jobId, coverLetter = '') {
  return request(app)
    .post(`/api/applications/job/${jobId}`)
    .set(bearer(token))
    .send({ coverLetter });
}

// Deliberately contains a clear seniority phrase, five required skills, and
// both job-title words so the local scorer has evidence for all three factors.
export const strongResumeText = [
  'Asha Sharma is a senior frontend developer with 5 years of experience.',
  'Built production applications using React, TypeScript, Node.js, Express, MongoDB, Docker and REST APIs.',
  'Designed microservices and deployed on AWS with CI/CD pipelines.',
].join(' ');

export const weakResumeText =
  'I worked in an office for two years doing data entry and preparing Excel reports for the team.';
