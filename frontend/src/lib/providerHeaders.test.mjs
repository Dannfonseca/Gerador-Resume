import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const currentDir = dirname(fileURLToPath(import.meta.url));
const wizardEngine = readFileSync(join(currentDir, '..', 'components', 'WizardEngine.jsx'), 'utf8');
const coverLetterPanel = readFileSync(join(currentDir, '..', 'components', 'CoverLetterPanel.jsx'), 'utf8');

test('wizard requests send all provider keys and the selected model', () => {
  assert.match(wizardEngine, /getApiKey\('gemini'\)/);
  assert.match(wizardEngine, /getApiKey\('openai'\)/);
  assert.match(wizardEngine, /getApiKey\('anthropic'\)/);
  assert.match(wizardEngine, /'x-api-key'/);
  assert.match(wizardEngine, /'x-openai-key'/);
  assert.match(wizardEngine, /'x-anthropic-key'/);
  assert.match(wizardEngine, /modelId:\s*getAiModel\(\)/);
});

test('cover letter generation uses the selected model and all provider keys', () => {
  assert.match(coverLetterPanel, /getAiModel\(\)/);
  assert.match(coverLetterPanel, /getApiKey\('anthropic'\)/);
  assert.match(coverLetterPanel, /'x-anthropic-key'/);
  assert.match(coverLetterPanel, /modelId/);
});
