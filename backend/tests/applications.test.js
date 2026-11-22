import './setup.js';
import { afterAll, afterEach, beforeAll, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { Job } from '../src/models/Job.js';
import {
  applyToJob,
  bearer,
  clearDB,
  closeTestDB,
  connectTestDB,
  createJob,
  registerUser,
  strongResumeText,
  weakResumeText,
} from './helpers.js';

const MATCHING_JOB = {
  title: 'Frontend Developer',
  skillsRequired: ['React', 'TypeScript', 'Node.js', 'MongoDB', 'REST APIs'],
  experienceLevel: 'mid',
};

describe('Applications and matching API', () => {
  beforeAll(connectTestDB);
  afterEach(clearDB);
  afterAll(closeTestDB);

  async function setupApplicants() {
    const recruiter = await registerUser(app, { role: 'recruiter' });
    const strong = await registerUser(app, { role: 'candidate' });
    const weak = await registerUser(app, { role: 'candidate' });
    const { job } = await createJob(app, recruiter.data.token, MATCHING_JOB);
    return { recruiter, strong, weak, job };
  }

  it('allows one application per candidate per job and blocks recruiters', async () => {
    const { recruiter, strong, job } = await setupApplicants();

    const first = await applyToJob(app, strong.data.token, job._id, 'I am a good fit.');
    expect(first.status).toBe(201);
    expect(first.body.data.application.status).toBe('applied');

    const duplicate = await applyToJob(app, strong.data.token, job._id);
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.message).toMatch(/already applied/i);

    const asRecruiter = await applyToJob(app, recruiter.data.token, job._id);
    expect(asRecruiter.status).toBe(403);
  });

  it('allows reapplying only from rejected and exposes statuses to the candidate', async () => {
    const { recruiter, strong, job } = await setupApplicants();
    const first = await applyToJob(app, strong.data.token, job._id, 'First attempt');
    const applicationId = first.body.data.application._id;

    const before = await request(app)
      .get('/api/applications/statuses')
      .set(bearer(strong.data.token));
    expect(before.status).toBe(200);
    expect(before.body.data.statuses[job._id]).toBe('applied');
    expect(
      (await request(app).get('/api/applications/statuses').set(bearer(recruiter.data.token)))
        .status
    ).toBe(403);

    // An active outcome cannot be reapplied to, even via a direct request.
    expect((await applyToJob(app, strong.data.token, job._id)).status).toBe(409);

    const decision = await request(app)
      .patch(`/api/applications/${applicationId}/status`)
      .set(bearer(recruiter.data.token))
      .send({ status: 'rejected' });
    expect(decision.status).toBe(200);

    const reapply = await applyToJob(app, strong.data.token, job._id, 'Second attempt');
    expect(reapply.status).toBe(200);
    expect(reapply.body.data.reapplied).toBe(true);
    expect(reapply.body.data.application.status).toBe('applied');
    expect(reapply.body.data.application.coverLetter).toBe('Second attempt');

    const after = await request(app)
      .get('/api/applications/statuses')
      .set(bearer(strong.data.token));
    expect(after.body.data.statuses[job._id]).toBe('applied');
  });

  it.each(['shortlisted', 'hired'])('blocks reapplying when %s', async (status) => {
    const { recruiter, strong, job } = await setupApplicants();
    const application = await applyToJob(app, strong.data.token, job._id);

    await request(app)
      .patch(`/api/applications/${application.body.data.application._id}/status`)
      .set(bearer(recruiter.data.token))
      .send({ status });

    const reapply = await applyToJob(app, strong.data.token, job._id);
    expect(reapply.status).toBe(409);
    expect(reapply.body.message).toMatch(/already applied/i);
  });

  it('rejects applications after the deadline and lists my applications', async () => {
    const recruiter = await registerUser(app, { role: 'recruiter' });
    const candidate = await registerUser(app, { role: 'candidate' });
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // The create validator correctly refuses a past deadline, so create an
    // open job first and then age it in the database to exercise apply's guard.
    const expiredJob = await createJob(app, recruiter.data.token);
    await Job.findByIdAndUpdate(expiredJob.job._id, { deadline: past });
    const rejected = await applyToJob(app, candidate.data.token, expiredJob.job._id);
    expect(rejected.status).toBe(400);
    expect(rejected.body.message).toMatch(/deadline has passed/i);

    const openJob = await createJob(app, recruiter.data.token);
    expect((await applyToJob(app, candidate.data.token, openJob.job._id)).status).toBe(201);

    const mine = await request(app)
      .get('/api/applications/mine')
      .set(bearer(candidate.data.token));
    expect(mine.status).toBe(200);
    expect(mine.body.data.applications).toHaveLength(1);
    expect(mine.body.data.applications[0].job.title).toBe('Frontend Developer');
  });

  it('restricts applicant lists and status changes to the job owner', async () => {
    const { recruiter, strong, job } = await setupApplicants();
    const stranger = await registerUser(app, { role: 'recruiter' });
    const application = await applyToJob(app, strong.data.token, job._id);
    const applicationId = application.body.data.application._id;

    const list = await request(app)
      .get(`/api/applications/job/${job._id}`)
      .set(bearer(recruiter.data.token));
    expect(list.status).toBe(200);
    expect(list.body.data.applications).toHaveLength(1);

    const strangerList = await request(app)
      .get(`/api/applications/job/${job._id}`)
      .set(bearer(stranger.data.token));
    expect(strangerList.status).toBe(403);

    const candidateList = await request(app)
      .get(`/api/applications/job/${job._id}`)
      .set(bearer(strong.data.token));
    expect(candidateList.status).toBe(403);

    const badStatus = await request(app)
      .patch(`/api/applications/${applicationId}/status`)
      .set(bearer(recruiter.data.token))
      .send({ status: 'unknown' });
    expect(badStatus.status).toBe(400);

    const strangerPatch = await request(app)
      .patch(`/api/applications/${applicationId}/status`)
      .set(bearer(stranger.data.token))
      .send({ status: 'shortlisted' });
    expect(strangerPatch.status).toBe(403);

    const updated = await request(app)
      .patch(`/api/applications/${applicationId}/status`)
      .set(bearer(recruiter.data.token))
      .send({ status: 'shortlisted' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.application.status).toBe('shortlisted');
  });

  it('saves, reads and deletes a resume with extracted skills and years', async () => {
    const candidate = await registerUser(app, { role: 'candidate' });
    const token = bearer(candidate.data.token);

    const initial = await request(app).get('/api/resume').set(token);
    expect(initial.status).toBe(200);
    expect(initial.body.data.hasResume).toBe(false);

    const shortText = await request(app)
      .put('/api/resume')
      .set(token)
      .send({ text: 'too short' });
    expect(shortText.status).toBe(400);

    const wrongFile = await request(app)
      .put('/api/resume')
      .set(token)
      .send({ text: strongResumeText, fileName: 'resume.exe' });
    expect(wrongFile.status).toBe(400);
    expect(wrongFile.body.details[0].message).toMatch(/only \.txt/i);

    // PDF/DOCX text is extracted in the browser, so the API accepts those names.
    const pdfFile = await request(app)
      .put('/api/resume')
      .set(token)
      .send({ text: strongResumeText, fileName: 'resume.pdf' });
    expect(pdfFile.status).toBe(200);
    expect(pdfFile.body.data.resume.fileName).toBe('resume.pdf');

    const saved = await request(app)
      .put('/api/resume')
      .set(token)
      .send({ text: strongResumeText, fileName: 'resume.txt' });
    expect(saved.status).toBe(200);
    expect(saved.body.data.resume.skills).toEqual(
      expect.arrayContaining(['React', 'TypeScript', 'Node.js', 'MongoDB', 'REST APIs'])
    );
    expect(saved.body.data.resume.yearsExperience).toBe(5);

    const fetched = await request(app).get('/api/resume').set(token);
    expect(fetched.body.data.hasResume).toBe(true);
    expect(fetched.body.data.resume.text).toBe(strongResumeText);
    expect(fetched.body.data.resume.text).not.toContain('password');

    const recruiter = await registerUser(app, { role: 'recruiter' });
    const denied = await request(app)
      .get('/api/resume')
      .set(bearer(recruiter.data.token));
    expect(denied.status).toBe(403);

    const removed = await request(app).delete('/api/resume').set(token);
    expect(removed.status).toBe(200);
    const afterDelete = await request(app).get('/api/resume').set(token);
    expect(afterDelete.body.data.hasResume).toBe(false);
    expect(afterDelete.body.data.resume.skills).toEqual([]);
  });

  it('scores a single job with an explainable local breakdown', async () => {
    const { strong, job } = await setupApplicants();
    const token = bearer(strong.data.token);

    await request(app).put('/api/resume').set(token).send({ text: strongResumeText });
    const noResumeJob = await createJob(app, (await registerUser(app, { role: 'recruiter' })).data.token);

    const match = await request(app).get(`/api/resume/match/${job._id}`).set(token);
    expect(match.status).toBe(200);
    const result = match.body.data.match;
    expect(result.provider).toBe('local');
    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.matchedSkills).toEqual(
      expect.arrayContaining(['React', 'TypeScript', 'Node.js', 'MongoDB', 'REST APIs'])
    );
    expect(result.missingSkills).toEqual([]);
    expect(result.breakdown).toHaveLength(3);
    expect(result.breakdown.map((item) => item.factor)).toEqual([
      'Required skills',
      'Experience level',
      'Role relevance',
    ]);
    expect(result.explanation.length).toBeGreaterThan(10);

    const noResume = await request(app)
      .get(`/api/resume/match/${noResumeJob.job._id}`)
      .set(bearer((await registerUser(app, { role: 'candidate' })).data.token));
    expect(noResume.status).toBe(400);
    expect(noResume.body.message).toMatch(/add your resume/i);
  });

  it('ranks recommended jobs best-first and requires a saved resume', async () => {
    const recruiter = await registerUser(app, { role: 'recruiter' });
    const candidate = await registerUser(app, { role: 'candidate' });
    const token = bearer(candidate.data.token);

    const withoutResume = await request(app).get('/api/jobs/recommended').set(token);
    expect(withoutResume.status).toBe(400);

    const unrelated = await createJob(app, recruiter.data.token, {
      title: 'Senior Java Engineer',
      skillsRequired: ['Java', 'Spring Boot'],
      experienceLevel: 'senior',
    });
    const related = await createJob(app, recruiter.data.token, MATCHING_JOB);

    await request(app).put('/api/resume').set(token).send({ text: strongResumeText });

    const ranked = await request(app).get('/api/jobs/recommended?limit=5').set(token);
    expect(ranked.status).toBe(200);
    expect(ranked.body.data.jobs).toHaveLength(2);
    expect(ranked.body.data.jobs[0]._id).toBe(related.job._id);
    expect(ranked.body.data.jobs[0].match.score).toBeGreaterThan(
      ranked.body.data.jobs[1].match.score
    );
    expect(ranked.body.data.jobs[1]._id).toBe(unrelated.job._id);
    expect(ranked.body.data.provider).toBe('local');
  });

  it('ranks applicants for the recruiter and keeps candidates out', async () => {
    const { recruiter, strong, weak, job } = await setupApplicants();

    await applyToJob(app, strong.data.token, job._id);
    await applyToJob(app, weak.data.token, job._id);
    await request(app)
      .put('/api/resume')
      .set(bearer(strong.data.token))
      .send({ text: strongResumeText });
    await request(app)
      .put('/api/resume')
      .set(bearer(weak.data.token))
      .send({ text: weakResumeText });

    const ranked = await request(app)
      .get(`/api/applications/job/${job._id}/ranked?limit=10`)
      .set(bearer(recruiter.data.token));

    expect(ranked.status).toBe(200);
    const { applicants, summary } = ranked.body.data;
    expect(applicants).toHaveLength(2);
    expect(applicants[0].candidate.email).toBe(strong.payload.email);
    // Ranked lists never load raw resume text, so title relevance is 0 here:
    // skills 60 + experience 20. A single-job match loads text and scores 100.
    expect(applicants[0].match.score).toBeGreaterThanOrEqual(75);
    expect(applicants[1].candidate.email).toBe(weak.payload.email);
    expect(applicants[1].match.score).toBeLessThan(applicants[0].match.score);
    expect(summary).toMatchObject({ total: 2, withResume: 2 });
    expect(summary.averageScore).toBeGreaterThan(0);
    expect(ranked.body.data.provider).toBe('local');

    const denied = await request(app)
      .get(`/api/applications/job/${job._id}/ranked`)
      .set(bearer(strong.data.token));
    expect(denied.status).toBe(403);
  });

  it('puts applicants without a resume at the bottom of the ranked list', async () => {
    const { recruiter, strong, weak, job } = await setupApplicants();

    await applyToJob(app, weak.data.token, job._id);
    await applyToJob(app, strong.data.token, job._id);
    await request(app)
      .put('/api/resume')
      .set(bearer(strong.data.token))
      .send({ text: strongResumeText });

    const ranked = await request(app)
      .get(`/api/applications/job/${job._id}/ranked`)
      .set(bearer(recruiter.data.token));

    expect(ranked.status).toBe(200);
    const { applicants, summary } = ranked.body.data;
    expect(applicants[0].hasResume).toBe(true);
    expect(applicants[1].hasResume).toBe(false);
    expect(applicants[1].match).toBeNull();
    expect(summary).toMatchObject({ total: 2, withResume: 1 });
  });
});
