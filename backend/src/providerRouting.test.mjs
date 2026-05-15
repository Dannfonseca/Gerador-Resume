import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const currentDir = dirname(fileURLToPath(import.meta.url));
const backendSource = readFileSync(join(currentDir, 'index.ts'), 'utf8');

test('backend extracts all provider keys through a single request-key helper', () => {
  assert.match(backendSource, /function getRequestKeys/);
  assert.match(backendSource, /x-api-key/);
  assert.match(backendSource, /x-openai-key/);
  assert.match(backendSource, /x-anthropic-key/);
});

test('backend does not reference undeclared provider key variables', () => {
  assert.doesNotMatch(backendSource, /requestAnthropicKey/);
  assert.doesNotMatch(backendSource, /requestOpenaiKey/);
});

test('all ai-backed endpoints use selected model routing instead of hardcoded Gemini calls', () => {
  assert.match(backendSource, /generateJsonWithSelectedModel/);
  assert.match(backendSource, /generateTextWithSelectedModel/);
  assert.doesNotMatch(backendSource, /model:\s*"gemini-2\.5-flash"/);
});

test('backend exposes a dedicated master generation endpoint without match score language', () => {
  assert.match(backendSource, /MASTER_RESUME_SYSTEM_PROMPT/);
  assert.match(backendSource, /\.post\("\/api\/generate-master"/);
  const masterPrompt = backendSource.match(/const MASTER_RESUME_SYSTEM_PROMPT = `([\s\S]*?)`;/)?.[1] || '';
  assert.doesNotMatch(masterPrompt, /Match Score/i);
  assert.match(masterPrompt, /preserve/i);
});

test('tailor resume returns latex artifacts for saved job versions', () => {
  const tailorBlock = backendSource.match(/\.post\("\/api\/tailor-resume"[\s\S]*?\}, \{ body:/)?.[0] || '';
  assert.match(tailorBlock, /formatResumeToLatex/);
  assert.match(tailorBlock, /latex/);
});
