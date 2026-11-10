import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { collections, loadSnapshot, sanitize, slugify, toRecord } from './content.mjs';

test('original slugs preserve legacy punctuation, Unicode, and whitespace behavior', () => {
  assert.equal(slugify('Hello, World!'), 'hello-world');
  assert.equal(slugify('A_B & Café'), 'a_b-caf');
  assert.equal(slugify(' Leading space '), '-leading-space-');
});

test('sanitization removes credential and ownership fields recursively', () => {
  assert.deepEqual(sanitize({
    title: 'Public title', _createdBy: 'private',
    media: { url: 'https://example.com/public.jpg', accessToken: 'private' },
    entries: [{ password: 'private', body: 'public' }],
  }), {
    title: 'Public title', media: { url: 'https://example.com/public.jpg' },
    entries: [{ body: 'public' }],
  });
  assert.throws(() => sanitize({ body: 'eyJabc.def.ghi' }), /credential/);
});

test('record conversion retains fields and exact existing legal/video slugs', () => {
  const source = { _id: 'legacy-id', slug: 'Exact_Slug', title: 'A title', image: { url: '/x.jpg' } };
  assert.equal(toRecord('legal', source, 2).slug, 'Exact_Slug');
  assert.equal(toRecord('videoPages', source, 2).slug, 'Exact_Slug');
  assert.equal(toRecord('news', source, 2).slug, 'a-title');
  assert.equal(toRecord('news', source, 2).source_order, 2);
  assert.throws(() => toRecord('news', { title: 'Missing identity' }, 0), /identity/);
});

test('fresh snapshot is complete, allowlisted, draft-free, and untruncated', async () => {
  const snapshot = await loadSnapshot();
  assert.deepEqual(Object.keys(snapshot.collections), collections);
  assert.ok(snapshot.collections.games.length > 100);
  assert.ok(snapshot.collections.news.length > 100);
  for (const records of Object.values(snapshot.collections)) {
    assert.ok(records.every((record) => record.draft !== true));
  }
});

test('migration defaults to read-only plan and refuses apply without a session', () => {
  const script = new URL('./migrate.mjs', import.meta.url);
  const env = { ...process.env };
  delete env.APP_SESSION_TOKEN;
  const plan = spawnSync(process.execPath, [script.pathname], { env, encoding: 'utf8' });
  assert.equal(plan.status, 0);
  assert.equal(JSON.parse(plan.stdout).mode, 'plan');
  const apply = spawnSync(process.execPath, [script.pathname, '--apply'], { env, encoding: 'utf8' });
  assert.equal(apply.status, 1);
  assert.match(apply.stderr, /no requests sent/);
});
