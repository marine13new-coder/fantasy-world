// Node 20+; drafts only. No provider SDK or generated-code execution.
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const draftDirectory = path.join(__dirname, 'AI-Drafts');
const defaultTask = '한국 동네 장기 좀비 생존 게임용 시설별 파밍 아이템 6개를 제안하세요. 편의점, 경찰서, 소방서, 학교, 업무지구, 주택가 각 하나. JSON 형식: {"items":[{"id":"snake_case","name":"한국어","facility":"한국어","description":"짧은 한국어","rarity":1}]}. 실제 상표는 사용하지 마세요.';

function localBase(value) {
  const url = new URL(value || 'http://127.0.0.1:3001/v1');
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) || url.protocol !== 'http:' || url.username || url.password || url.search || url.hash)
    throw new Error('Only a local HTTP FreeLLMAPI endpoint is allowed.');
  if (url.pathname.replace(/\/$/, '') !== '/v1') throw new Error('Base URL must end in /v1.');
  return url.href.replace(/\/$/, '');
}

function parseDraft(content) {
  if (typeof content !== 'string' || content.length > 100000) throw new Error('Missing or oversized JSON content.');
  const cleaned = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const data = JSON.parse(cleaned);
  if (!data || typeof data !== 'object') throw new Error('Draft must be a JSON object or array.');
  return data;
}

async function requestJson(base, key, route, body, fetcher = fetch) {
  if (!key || !key.trim()) throw new Error('Set FREELLM_API_KEY to the unified key from the dashboard. Never paste provider keys into chat.');
  let response;
  try {
    response = await fetcher(base + route, {
      method: body ? 'POST' : 'GET', redirect: 'error', signal: AbortSignal.timeout(60000),
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
  } catch { throw new Error('Local FreeLLMAPI connection failed or timed out. Start the server, then retry once.'); }
  // Never print raw error bodies: upstream responses may contain credentials or prompts.
  if (!response.ok) {
    const hint = { 400: 'Check the model/profile and request format.', 401: 'Check the unified API key.', 403: 'This key cannot use the selected model.', 429: 'Free quota exhausted; wait or choose another configured free provider.', 503: 'No usable provider; add a free-tier key in the dashboard.' };
    throw new Error(`FreeLLMAPI HTTP ${response.status}. ${hint[response.status] || 'Check the local dashboard.'}`);
  }
  const text = await response.text();
  if (text.length > 200000) throw new Error('Response exceeded the draft size limit.');
  try { return JSON.parse(text); } catch { throw new Error('Server returned invalid JSON.'); }
}

async function main(args = process.argv.slice(2)) {
  const base = localBase(process.env.FREELLM_BASE_URL);
  const key = process.env.FREELLM_API_KEY;
  if (args.includes('--check')) {
    const result = await requestJson(base, key, '/models?execution_status=ready');
    const ready = (result.data || []).filter(m => m.execution_status === 'ready' && !m.id?.startsWith('auto') && m.id !== 'fusion');
    console.log(`Ready provider models: ${ready.length}. No generation requested.`);
    if (!ready.length) process.exitCode = 2;
    return;
  }
  const unknown = args.filter(a => !['--prompt'].includes(a) && args[args.indexOf(a) - 1] !== '--prompt');
  if (unknown.length) throw new Error('Usage: node FreeLLMWorker.js [--check | --prompt task.txt]');
  const promptIndex = args.indexOf('--prompt');
  if (promptIndex >= 0 && !args[promptIndex + 1]) throw new Error('--prompt requires a UTF-8 file path.');
  const task = promptIndex < 0 ? defaultTask : fs.readFileSync(args[promptIndex + 1], 'utf8');
  if (!task.trim() || task.length > 12000) throw new Error('Task must contain 1–12000 characters. Send only the task-specific excerpt.');
  const model = process.env.FREELLM_MODEL || 'auto:game-data';
  if (model === 'fusion') throw new Error('Fusion is disabled to avoid multiple model calls.');
  const result = await requestJson(base, key, '/chat/completions', {
    model, max_tokens: 1000, temperature: 0.35, stream: false,
    messages: [
      { role: 'system', content: 'You draft JSON for a Korean long-term survival Unity game. Return only valid JSON. Preserve component boundaries, editable data, explicit state machines, and optional asset slots. Never request secrets, claim tests passed, execute code, or invent verified real locations. The lead developer reviews every draft before use.' },
      { role: 'user', content: task }
    ]
  });
  if (result.choices?.[0]?.finish_reason === 'length') throw new Error('Output was truncated; request a smaller batch. No draft saved.');
  const data = parseDraft(result.choices?.[0]?.message?.content);
  fs.mkdirSync(draftDirectory, { recursive: true });
  const target = path.join(draftDirectory, `${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}.json`);
  fs.writeFileSync(target, JSON.stringify({ reviewStatus: 'unreviewed', requestedModel: model, returnedModel: result.model || null, createdUtc: new Date().toISOString(), usage: result.usage || null, data }, null, 2), { flag: 'wx' });
  console.log(`Draft saved for review: ${target}`);
}

module.exports = { localBase, parseDraft, requestJson };
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
