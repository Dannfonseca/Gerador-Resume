import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const currentDir = dirname(fileURLToPath(import.meta.url));
const pipelineSource = readFileSync(join(currentDir, 'PipelineView.jsx'), 'utf8');

test('pipeline no longer uses global target job state', () => {
  assert.doesNotMatch(pipelineSource, /window\._targetJobId/);
});

test('pipeline renders saved processing state and retry errors', () => {
  assert.match(pipelineSource, /job\.isProcessing/);
  assert.match(pipelineSource, /job\.processingError/);
  assert.match(pipelineSource, /Tentar novamente/);
});

test('pipeline uses tailored resume modal for saved resume versions', () => {
  assert.match(pipelineSource, /TailoredResumeModal/);
  assert.match(pipelineSource, /updateResumeForJob/);
});
