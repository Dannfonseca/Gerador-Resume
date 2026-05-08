import test from 'node:test';
import assert from 'node:assert/strict';

import { hasItems, normalizeGeneratedResumes } from './resumePayload.js';

const professional = {
  name: 'Daniel Fonseca',
  experience: [{ role: 'Desenvolvedor Fullstack' }],
};

const heritage = {
  name: 'Daniel Fonseca',
  projects: [{ name: 'ATS Pro' }],
};

test('normalizes the separated professional and heritage payload', () => {
  const normalized = normalizeGeneratedResumes({ professional, heritage });

  assert.equal(normalized.professional, professional);
  assert.equal(normalized.heritage, heritage);
});

test('keeps compatibility with the temporary traditional key', () => {
  const normalized = normalizeGeneratedResumes({ traditional: professional, heritage });

  assert.equal(normalized.professional, professional);
  assert.equal(normalized.heritage, heritage);
});

test('wraps an old single generated resume payload as both layouts', () => {
  const normalized = normalizeGeneratedResumes(professional);

  assert.equal(normalized.professional, professional);
  assert.equal(normalized.heritage, professional);
});

test('detects non-empty resume sections', () => {
  assert.equal(hasItems([{ role: 'Dev' }]), true);
  assert.equal(hasItems([]), false);
  assert.equal(hasItems(undefined), false);
});
