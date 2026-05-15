import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const currentDir = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(currentDir, 'TailoredResumeModal.jsx'), 'utf8');

test('tailored resume modal exposes result actions for saved job resumes', () => {
  assert.match(source, /CoverLetterPanel/);
  assert.match(source, /normalizeGeneratedResumes/);
  assert.match(source, /setValueAtPath/);
  assert.match(source, /resumeToPlainText/);
  assert.match(source, /RESUME_LAYOUTS/);
  assert.match(source, /\/api\/refine/);
  assert.match(source, /window\.print/);
  assert.match(source, /navigator\.clipboard\.writeText/);
  assert.match(source, /onSaveVersion/);
});
