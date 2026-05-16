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

test('pipeline shows detailed api failure messages for tailoring errors', () => {
  assert.match(pipelineSource, /function formatApiError/);
  assert.match(pipelineSource, /payload\?\.details/);
  assert.match(pipelineSource, /payload\?\.hint/);
  assert.match(pipelineSource, /tailorResponse\.status/);
  assert.match(pipelineSource, /readJsonResponse\(tailorResponse\)/);
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

test('pipeline saves a job before asynchronous job analysis finishes', () => {
  assert.match(pipelineSource, /analysisStatus:\s*'analyzing'/);
  assert.match(pipelineSource, /processJobAnalysisBackground/);
  assert.match(pipelineSource, /analysisStatus:\s*'ready'/);
  assert.match(pipelineSource, /analysisStatus:\s*'failed'/);
});

test('pipeline lets users dismiss the loading modal and reopen ready analysis', () => {
  assert.match(pipelineSource, /Fechar e continuar/);
  assert.match(pipelineSource, /pipeline-ready-button/);
  assert.match(pipelineSource, /Abrir an[aá]lise/);
  assert.match(pipelineSource, /openJobAnalysis/);
});
