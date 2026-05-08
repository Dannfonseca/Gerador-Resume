import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const currentDir = dirname(fileURLToPath(import.meta.url));
const sidebar = readFileSync(join(currentDir, 'Sidebar.jsx'), 'utf8');
const app = readFileSync(join(currentDir, '..', 'App.jsx'), 'utf8');

test('sidebar only exposes the ATS generator single page', () => {
  for (const removedText of [
    'Modelos Brasileiros',
    'Modelos Gringos',
    'Paula Ferreira',
    'João Vieira',
    'Patrick Bateman',
  ]) {
    assert.doesNotMatch(sidebar, new RegExp(removedText, 'i'));
  }

  assert.match(sidebar, /Gerar Currículo ATS/);
});

test('sidebar contains a short ATS explanation instead of article navigation', () => {
  assert.match(sidebar, /O que é ATS\?/);
  assert.match(sidebar, /palavras-chave/);
  assert.doesNotMatch(sidebar, /Guia Definitivo/);
});

test('app renders the generator directly without article or resume routes', () => {
  assert.doesNotMatch(app, /ArticleView/);
  assert.doesNotMatch(app, /ResumeView/);
  assert.doesNotMatch(app, /activeResume/);
  assert.doesNotMatch(app, /activeView/);
  assert.match(app, /<AiGeneratorView \/>/);
});
