import './setup.js';
import { afterAll, afterEach, beforeAll, describe, expect, it } from '@jest/globals';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../src/app.js';
import { env } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { bearer, clearDB, closeTestDB, connectTestDB, registerUser } from './helpers.js';

describe('Auth API', () => {
  beforeAll(connectTestDB);
  afterEach(clearDB);
  afterAll(closeTestDB);

  it('registers a user, hashes the password, and never serialises it', async () => {
    const { response, payload, data } = await registerUser(app, {
      email: 'register@example.com',
    });

    expect(response.status).toBe(201);
    expect(data.user.email).toBe(payload.email);
    expect(data.user.role).toBe('candidate');
    expect(data.user.password).toBeUndefined();
    expect(typeof data.token).toBe('string');

    const stored = await User.findOne({ email: payload.email }).select('+password');
    expect(stored.password).not.toBe(payload.password);
    expect(stored.password).toMatch(/^\$2[aby]\$/);
  });

  it('rejects a duplicate email with 409', async () => {
    const first = await registerUser(app, { email: 'duplicate@example.com' });
    expect(first.response.status).toBe(201);

    const second = await registerUser(app, { email: 'duplicate@example.com' });
    expect(second.response.status).toBe(409);
    expect(second.response.body.success).toBe(false);
    expect(second.response.body.message).toMatch(/already exists/i);
  });

  it('returns field-level validation details for an invalid registration', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: 'x',
      email: 'not-an-email',
      password: 'short',
      role: 'admin',
    });

    expect(response.status).toBe(400);
    const fields = response.body.details.map((item) => item.field);
    expect(fields).toEqual(expect.arrayContaining(['name', 'email', 'password', 'role']));
    expect(response.body.details.every((item) => typeof item.message === 'string')).toBe(true);
  });

  it('uses the same 401 message for a wrong password and an unknown email', async () => {
    await registerUser(app, { email: 'login@example.com' });

    const correct = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'Password123',
    });
    expect(correct.status).toBe(200);
    expect(correct.body.data.token).toEqual(expect.any(String));

    const wrongPassword = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'WrongPassword123',
    });
    const unknownEmail = await request(app).post('/api/auth/login').send({
      email: 'nobody@example.com',
      password: 'WrongPassword123',
    });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
    expect(wrongPassword.body.message).toBe('Invalid email or password');
  });

  it('protects /auth/me and maps malformed and expired tokens to 401', async () => {
    const { data } = await registerUser(app);

    const missing = await request(app).get('/api/auth/me');
    expect(missing.status).toBe(401);

    const valid = await request(app).get('/api/auth/me').set(bearer(data.token));
    expect(valid.status).toBe(200);
    expect(valid.body.data.user.email).toBe(data.user.email);

    const malformed = await request(app).get('/api/auth/me').set(bearer('not-a-jwt'));
    expect(malformed.status).toBe(401);
    expect(malformed.body.message).toMatch(/invalid token/i);

    const expiredToken = jwt.sign({ id: data.user._id }, env.jwtSecret, {
      expiresIn: '-1h',
    });
    const expired = await request(app).get('/api/auth/me').set(bearer(expiredToken));
    expect(expired.status).toBe(401);
    expect(expired.body.message).toMatch(/session has expired/i);
  });

  it('reads the role from MongoDB on every request, not from the token', async () => {
    const { data } = await registerUser(app, { role: 'candidate' });

    const before = await request(app).get('/api/jobs/mine').set(bearer(data.token));
    expect(before.status).toBe(403);

    await User.findByIdAndUpdate(data.user._id, { role: 'recruiter' });

    const after = await request(app).get('/api/jobs/mine').set(bearer(data.token));
    expect(after.status).toBe(200);
  });

  it('returns a structured 404 for an unknown route', async () => {
    const response = await request(app).get('/api/does-not-exist');
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/was not found/i);
  });
});
