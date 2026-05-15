import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const currentDir = dirname(fileURLToPath(import.meta.url));
const sidebar = readFileSync(join(currentDir, 'Sidebar.jsx'), 'utf8');
const app = readFileSync(join(currentDir, '..', 'App.jsx'), 'utf8');

test('sidebar exposes the wizard, docs, master resume, and job pipeline entries', () => {
  for (const removedText of [
    'Modelos Brasileiros',
    'Modelos Gringos',
    'Paula Ferreira',
    'Joao Vieira',
    'Patrick Bateman',
    'AiGeneratorView',
  ]) {
    assert.doesNotMatch(sidebar, new RegExp(removedText, 'i'));
  }

  assert.match(sidebar, /wizard-container/);
  assert.match(sidebar, /SettingsModal/);
  assert.match(sidebar, /nav\.docs/);
  assert.match(sidebar, /nav\.app/);
  assert.match(sidebar, /nav\.pipeline/);
  assert.match(sidebar, /nav\.master/);
  assert.match(sidebar, /wizard\.steps/);
});

test('app renders the wizard directly and mounts the local pipeline pages by tab', () => {
  assert.doesNotMatch(app, /ArticleView/);
  assert.doesNotMatch(app, /import ResumeView/);
  assert.doesNotMatch(app, /<ResumeView/);
  assert.doesNotMatch(app, /activeResume/);
  assert.doesNotMatch(app, /activeView/);
  assert.match(app, /<WizardEngine/);
  assert.match(app, /<PipelineView/);
  assert.match(app, /<MasterResumeView/);
});
