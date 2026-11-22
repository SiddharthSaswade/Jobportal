import './setup.js';
import { afterAll, afterEach, beforeAll, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { Application } from '../src/models/Application.js';
import { Job } from '../src/models/Job.js';
import {
  applyToJob,
  bearer,
  clearDB,
  closeTestDB,
  connectTestDB,
  createJob,
  registerUser,
  validJob,
} from './helpers.js';

describe('Jobs API', () => {
  beforeAll(connectTestDB);
  afterEach(clearDB);
  afterAll(closeTestDB);

  it('creates a job and ignores a forged postedBy value (mass assignment)', async () => {
    const owner = await registerUser(app, { role: 'recruiter' });
    const attacker = await registerUser(app, { role: 'recruiter' });

    const response = await request(app)
      .post('/api/jobs')
      .set(bearer(owner.data.token))
      .send(validJob({ postedBy: attacker.data.user._id }));

    expect(response.status).toBe(201);
    expect(String(response.body.data.job.postedBy)).toBe(String(owner.data.user._id));
  });

  it('blocks candidates and unauthenticated users from posting jobs', async () => {
    const candidate = await registerUser(app, { role: 'candidate' });

    const asCandidate = await request(app)
      .post('/api/jobs')
      .set(bearer(candidate.data.token))
      .send(validJob());
    expect(asCandidate.status).toBe(403);

    const anonymous = await request(app).post('/api/jobs').send(validJob());
    expect(anonymous.status).toBe(401);
  });

  it('validates the create payload and returns field-level details', async () => {
    const recruiter = await registerUser(app, { role: 'recruiter' });

    const response = await request(app)
      .post('/api/jobs')
      .set(bearer(recruiter.data.token))
      .send({
        title: 'ab',
        company: '',
        location: '',
        description: 'too short',
        skillsRequired: [],
        jobType: 'unknown',
        salaryMin: 900,
        salaryMax: 100,
        deadline: 'not-a-date',
      });

    expect(response.status).toBe(400);
    const fields = response.body.details.map((item) => item.field);
    expect(fields).toEqual(
      expect.arrayContaining(['title', 'company', 'description', 'skillsRequired', 'jobType'])
    );
  });

  it('serves /jobs/mine before the /jobs/:id route', async () => {
    const recruiter = await registerUser(app, { role: 'recruiter' });
    const { job } = await createJob(app, recruiter.data.token, { title: 'Unique Mine Job' });
    expect(job).toBeDefined();

    const mine = await request(app).get('/api/jobs/mine').set(bearer(recruiter.data.token));
    expect(mine.status).toBe(200);
    expect(mine.body.data.jobs).toHaveLength(1);
    expect(mine.body.data.jobs[0].title).toBe('Unique Mine Job');

    const candidate = await registerUser(app, { role: 'candidate' });
    const denied = await request(app).get('/api/jobs/mine').set(bearer(candidate.data.token));
    expect(denied.status).toBe(403);
  });

  it('returns 400 for a malformed id and 404 for a well-formed unknown id', async () => {
    const user = await registerUser(app);

    const malformed = await request(app).get('/api/jobs/not-an-id').set(bearer(user.data.token));
    expect(malformed.status).toBe(400);

    const missing = await request(app)
      .get('/api/jobs/64b7f0000000000000000000')
      .set(bearer(user.data.token));
    expect(missing.status).toBe(404);
  });

  it('lets only the owning recruiter update and delete a job', async () => {
    const owner = await registerUser(app, { role: 'recruiter' });
    const stranger = await registerUser(app, { role: 'recruiter' });
    const { job } = await createJob(app, owner.data.token);

    const forbiddenPatch = await request(app)
      .patch(`/api/jobs/${job._id}`)
      .set(bearer(stranger.data.token))
      .send({ title: 'Hacked Title' });
    expect(forbiddenPatch.status).toBe(403);

    const patched = await request(app)
      .patch(`/api/jobs/${job._id}`)
      .set(bearer(owner.data.token))
      .send({ title: 'Updated Frontend Role', salaryMax: 1200000 });
    expect(patched.status).toBe(200);
    expect(patched.body.data.job.title).toBe('Updated Frontend Role');
    expect(patched.body.data.job.salaryMax).toBe(1200000);

    const forbiddenDelete = await request(app)
      .delete(`/api/jobs/${job._id}`)
      .set(bearer(stranger.data.token));
    expect(forbiddenDelete.status).toBe(403);

    const deleted = await request(app)
      .delete(`/api/jobs/${job._id}`)
      .set(bearer(owner.data.token));
    expect(deleted.status).toBe(200);
    expect(await Job.countDocuments({ _id: job._id })).toBe(0);
  });

  it('searches by weighted text index, filters, sorts and paginates', async () => {
    const recruiter = await registerUser(app, { role: 'recruiter' });
    const token = bearer(recruiter.data.token);

    await createJob(app, recruiter.data.token, {
      title: 'Frontend Developer',
      skillsRequired: ['React', 'Node.js'],
      location: 'Pune',
      salaryMin: 500000,
      salaryMax: 900000,
    });
    await createJob(app, recruiter.data.token, {
      title: 'Backend Engineer',
      company: 'Beta Corp',
      description: 'Maintain Java services and Spring Boot microservices for the platform.',
      skillsRequired: ['Java', 'Spring Boot'],
      location: 'Mumbai',
      salaryMin: 800000,
      salaryMax: 1200000,
    });
    await createJob(app, recruiter.data.token, {
      title: 'React Intern',
      company: 'Gamma',
      skillsRequired: ['React'],
      location: 'Pune',
      salaryMin: 100000,
      salaryMax: 200000,
    });

    const byKeyword = await request(app).get('/api/jobs?keyword=React').set(token);
    expect(byKeyword.status).toBe(200);
    expect(byKeyword.body.data.jobs.map((job) => job.title).sort()).toEqual([
      'Frontend Developer',
      'React Intern',
    ]);

    const byLocation = await request(app).get('/api/jobs?location=pune').set(token);
    expect(byLocation.body.data.jobs).toHaveLength(2);

    const bySkills = await request(app).get('/api/jobs?skills=React,Node.js').set(token);
    expect(bySkills.body.data.jobs).toHaveLength(1);
    expect(bySkills.body.data.jobs[0].title).toBe('Frontend Developer');

    const sorted = await request(app).get('/api/jobs?sort=-salaryMax').set(token);
    expect(sorted.body.data.jobs.map((job) => job.salaryMax)).toEqual([1200000, 900000, 200000]);

    const page2 = await request(app).get('/api/jobs?sort=-salaryMax&limit=2&page=2').set(token);
    expect(page2.body.data.jobs.map((job) => job.title)).toEqual(['React Intern']);
    expect(page2.body.data.pagination).toMatchObject({
      page: 2,
      limit: 2,
      total: 3,
      totalPages: 2,
      hasNextPage: false,
      hasPrevPage: true,
    });

    const badLimit = await request(app).get('/api/jobs?limit=100').set(token);
    expect(badLimit.status).toBe(400);
    const badSort = await request(app).get('/api/jobs?sort=password').set(token);
    expect(badSort.status).toBe(400);
  });

  it('deletes a job together with its applications', async () => {
    const recruiter = await registerUser(app, { role: 'recruiter' });
    const candidate = await registerUser(app, { role: 'candidate' });
    const { job } = await createJob(app, recruiter.data.token);

    const application = await applyToJob(app, candidate.data.token, job._id);
    expect(application.status).toBe(201);
    expect(await Application.countDocuments({ job: job._id })).toBe(1);

    const response = await request(app)
      .delete(`/api/jobs/${job._id}`)
      .set(bearer(recruiter.data.token));
    expect(response.status).toBe(200);
    expect(await Application.countDocuments({ job: job._id })).toBe(0);
  });
});
