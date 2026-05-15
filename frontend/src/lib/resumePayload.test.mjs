import test from 'node:test';
import assert from 'node:assert/strict';

import {
  hasItems,
  normalizeGeneratedResumes,
  resumeToPlainText,
  setValueAtPath,
} from './resumePayload.js';

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

test('updates a nested resume value by dot path without mutating the original object', () => {
  const source = {
    professional: {
      summary: 'Old summary',
      experience: [
        { responsibilities: ['Old bullet'] }
      ]
    }
  };

  const next = setValueAtPath(source, 'professional.experience.0.responsibilities.0', 'New bullet');

  assert.equal(source.professional.experience[0].responsibilities[0], 'Old bullet');
  assert.equal(next.professional.experience[0].responsibilities[0], 'New bullet');
});

test('creates plain text from a structured resume for cover letters and AI refinement', () => {
  const text = resumeToPlainText({
    name: 'Daniel Fonseca',
    title: 'Full Stack Developer',
    email: 'daniel@example.com',
    phone: '+55 11 99999-9999',
    summary: 'Builds ATS tools.',
    experience: [
      {
        role: 'Developer',
        company: 'ATS Pro',
        responsibilities: ['Built resume parser', 'Improved job matching']
      }
    ],
    skillsGroup: [
      { category: 'Tech', items: ['React', 'Bun'] }
    ]
  });

  assert.match(text, /Daniel Fonseca/);
  assert.match(text, /Full Stack Developer/);
  assert.match(text, /Built resume parser/);
  assert.match(text, /React, Bun/);
});
