import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const currentDir = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(currentDir, 'HeritageTheme.jsx'), 'utf8');

test('heritage theme exposes editable fields through onEdit paths', () => {
  assert.match(source, /function EditableText/);
  assert.match(source, /export default function HeritageTheme\(\{ data, onEdit \}\)/);
  assert.match(source, /onEdit\(path, value\)/);
  assert.match(source, /path="summary"/);
  assert.match(source, /experience\.\$\{idx\}\.responsibilities\.\$\{itemIdx\}/);
  assert.match(source, /projects\.\$\{idx\}\.description/);
  assert.match(source, /education\.\$\{idx\}\.degree/);
});
