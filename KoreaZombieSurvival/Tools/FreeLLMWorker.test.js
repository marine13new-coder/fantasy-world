const { test } = require('node:test');
const assert = require('node:assert/strict');
const { localBase, parseDraft, requestJson } = require('./FreeLLMWorker.js');
test('accepts loopback only and rejects credential forwarding', () => {
  assert.equal(localBase(), 'http://127.0.0.1:3001/v1');
  for (const address of ['https://example.com/v1', 'http://user:pass@localhost:3001/v1', 'http://localhost:3001/other']) assert.throws(() => localBase(address));
});
test('accepts JSON drafts and rejects executable or malformed answers', () => {
  assert.deepEqual(parseDraft('```json\n{"items":[]}\n```'), { items: [] });
  for (const answer of ['run("file")', 'null', '{}'.repeat(100000)]) assert.throws(() => parseDraft(answer));
});
test('missing key fails before connecting', async () => {
  await assert.rejects(requestJson(localBase(), '', '/models', null, () => { throw Error('Should not connect'); }), /FREELLM_API_KEY/);
});
test('HTTP quota failure never exposes upstream body', async () => {
  await assert.rejects(requestJson(localBase(), 'test-only', '/models', null, async () => ({ ok: false, status: 429, text: () => 'secret' })), /HTTP 429/);
});
test('connection failure is bounded and readable', async () => {
  await assert.rejects(requestJson(localBase(), 'test-only', '/models', null, async () => { throw Error('sensitive upstream value'); }), /connection failed/);
});
test('successful mock response is parsed without generating game files', async () => {
  assert.deepEqual(await requestJson(localBase(), 'test-only', '/models', null, async () => ({ ok: true, text: async () => '{"data":[]}' })), { data: [] });
});
