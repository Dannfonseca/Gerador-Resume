import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const currentDir = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(currentDir, 'resume.css'), 'utf8');
const printCss = css.match(/@media print\s*\{[\s\S]*$/)?.[0] ?? '';

test('print styles keep compact resume sections from splitting across pages', () => {
  for (const selector of ['.db-proj-item', '.db-edu-item', '.skills-grid > div', '.db-skill-row']) {
    assert.match(printCss, new RegExp(`${selector.replace('.', '\\.')}[\\s\\S]*break-inside:\\s*avoid-page`));
    assert.match(printCss, new RegExp(`${selector.replace('.', '\\.')}[\\s\\S]*page-break-inside:\\s*avoid`));
  }
});

test('print styles allow long experience entries to split instead of leaving large blank gaps', () => {
  assert.match(printCss, /\.professional-row,[\s\S]*\.db-exp-item,[\s\S]*break-inside:\s*auto/);
  assert.match(printCss, /\.professional-row,[\s\S]*\.db-exp-item,[\s\S]*page-break-inside:\s*auto/);
});

test('print styles keep section titles with following content', () => {
  assert.match(printCss, /\.resume-paper \.section-title,[\s\S]*\.db-section-title[\s\S]*break-after:\s*avoid-page/);
  assert.match(printCss, /\.resume-paper \.section-title,[\s\S]*\.db-section-title[\s\S]*page-break-after:\s*avoid/);
});

test('print styles allow the resume paper to continue across pages', () => {
  assert.match(printCss, /\.resume-paper\s*\{[\s\S]*overflow:\s*visible !important/);
});

test('print styles suppress browser headers and repeat resume padding per page', () => {
  assert.match(printCss, /@page\s*\{[\s\S]*margin:\s*0/);
  assert.match(printCss, /\.resume-paper\s*\{[\s\S]*padding:\s*14mm 20mm 16mm !important/);
  assert.match(printCss, /\.resume-paper\s*\{[\s\S]*box-decoration-break:\s*clone/);
  assert.match(printCss, /\.resume-paper\s*\{[\s\S]*-webkit-box-decoration-break:\s*clone/);
});
