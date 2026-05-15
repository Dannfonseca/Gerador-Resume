import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createJob,
  addJobToList,
  addResumeToJobList,
  deleteJobFromList,
  deleteResumeFromJobList,
  resetStaleProcessingJobs,
  updateJobInList,
  updateResumeInJobList,
} from './jobPipelineStorage.js';

test('adds a job with default pipeline fields', () => {
  const job = createJob({
    company: 'Acme',
    title: 'Frontend Engineer',
    url: 'https://example.com/job',
    jdRaw: 'React role',
  }, { id: 'job-1', now: '2026-05-15T10:00:00.000Z' });
  const jobs = addJobToList([], job);

  assert.equal(jobs[0].id, 'job-1');
  assert.equal(jobs[0].status, 'A Avaliar');
  assert.equal(jobs[0].isProcessing, false);
  assert.deepEqual(jobs[0].resumes, []);
});

test('updates a job and appends a resume version', () => {
  const job = createJob({ company: 'Acme', title: 'Dev', jdRaw: 'Job' }, { id: 'job-1', now: '2026-05-15T10:00:00.000Z' });
  const start = addJobToList([], job);
  const processing = updateJobInList(start, 'job-1', { isProcessing: true });
  const withResume = addResumeToJobList(processing, 'job-1', {
    name: 'Versao 1',
    data: { professional: { name: 'Daniel' }, heritage: { name: 'Daniel' } },
  }, { id: 'resume-1', now: '2026-05-15T10:01:00.000Z' });

  assert.equal(withResume[0].isProcessing, true);
  assert.equal(withResume[0].resumes[0].id, 'resume-1');
  assert.equal(withResume[0].resumes[0].dateCreated, '2026-05-15T10:01:00.000Z');
});

test('updates and deletes one resume version without changing other jobs', () => {
  const jobs = [
    {
      id: 'job-1',
      resumes: [
        { id: 'resume-1', data: { professional: { summary: 'Old' } } },
        { id: 'resume-2', data: { professional: { summary: 'Keep' } } },
      ],
    },
    { id: 'job-2', resumes: [{ id: 'resume-3', data: {} }] },
  ];

  const updated = updateResumeInJobList(jobs, 'job-1', 'resume-1', { data: { professional: { summary: 'New' } } });
  const deleted = deleteResumeFromJobList(updated, 'job-1', 'resume-2');

  assert.equal(deleted[0].resumes.length, 1);
  assert.equal(deleted[0].resumes[0].data.professional.summary, 'New');
  assert.equal(deleted[1].resumes[0].id, 'resume-3');
});

test('resets stale processing jobs after a page reload', () => {
  const jobs = resetStaleProcessingJobs([
    { id: 'job-1', isProcessing: true, processingError: null },
    { id: 'job-2', isProcessing: false, processingError: null },
  ]);

  assert.equal(jobs[0].isProcessing, false);
  assert.match(jobs[0].processingError, /recarregamento/);
  assert.equal(jobs[1].processingError, null);
});

test('deletes jobs by id', () => {
  const jobs = deleteJobFromList([{ id: 'job-1' }, { id: 'job-2' }], 'job-1');
  assert.deepEqual(jobs, [{ id: 'job-2' }]);
});
