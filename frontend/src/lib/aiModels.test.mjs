import test from 'node:test';
import assert from 'node:assert/strict';

import { DEFAULT_AI_MODEL, PROVIDERS, getProviderForModel } from './aiModels.js';

const allModels = PROVIDERS.flatMap((provider) =>
  provider.models.map((model) => ({ provider: provider.id, ...model }))
);
const allModelIds = allModels.map((model) => model.id);

test('active model list contains only current non-legacy text models', () => {
  for (const legacyId of [
    'gemini-1.5-flash-8b',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-1.5-pro-002',
    'gemini-2.0-flash',
    'gemini-2.0-pro-exp',
    'gpt-3.5-turbo',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-4o',
    'o1-mini',
    'o1-preview',
    'claude-2.1',
    'claude-3-sonnet-20240229',
    'claude-3-opus-20240229',
    'claude-3-5-sonnet-20241022',
  ]) {
    assert.equal(allModelIds.includes(legacyId), false, `${legacyId} should not be selectable`);
  }
});

test('model list includes current supported models for all providers', () => {
  for (const currentId of [
    'gemini-3.1-pro-preview',
    'gemini-3-flash-preview',
    'gemini-3.1-flash-lite',
    'gemini-2.5-pro',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gpt-5.5',
    'gpt-5.4',
    'gpt-5.4-mini',
    'gpt-5.4-nano',
    'gpt-4.1',
    'claude-opus-4-7',
    'claude-sonnet-4-6',
    'claude-haiku-4-5-20251001',
  ]) {
    assert.ok(allModelIds.includes(currentId), `${currentId} should be selectable`);
  }
});

test('default model is selectable and provider routing is explicit', () => {
  assert.ok(allModelIds.includes(DEFAULT_AI_MODEL));
  assert.equal(getProviderForModel('gemini-2.5-flash'), 'gemini');
  assert.equal(getProviderForModel('gpt-5.4-mini'), 'openai');
  assert.equal(getProviderForModel('claude-sonnet-4-6'), 'anthropic');
  assert.equal(getProviderForModel('unknown-model'), null);
});
