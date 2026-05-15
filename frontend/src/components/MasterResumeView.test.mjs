import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const currentDir = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(currentDir, 'MasterResumeView.jsx'), 'utf8');

test('master resume view uses the dedicated master endpoint and provider routing', () => {
  assert.match(source, /\/api\/generate-master/);
  assert.match(source, /careerFocus/);
  assert.match(source, /getApiKey\('gemini'\)/);
  assert.match(source, /getApiKey\('openai'\)/);
  assert.match(source, /getApiKey\('anthropic'\)/);
  assert.match(source, /modelId:\s*getAiModel\(\)/);
});

test('master resume view supports field-level manual and AI editing', () => {
  assert.match(source, /setValueAtPath/);
  assert.match(source, /handleMasterFieldClick/);
  assert.match(source, /handleManualFieldSave/);
  assert.match(source, /handleAiFieldSave/);
  assert.match(source, /\/api\/refine/);
  assert.match(source, /onEdit=\{interactionMode !== 'none' \? handleMasterFieldClick : null\}/);
});
