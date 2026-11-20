// Itinera AI proxy (Cloudflare Worker).
//
// Keeps the Gemini API key on the server so the public GitHub Pages site can offer AI features
// without shipping a key to visitors. It forwards only the Gemini endpoints the app uses:
//   POST /v1beta/models/{model}:generateContent
//   POST /v1beta/models/{model}:streamGenerateContent
//   GET  /v1beta/models
//
// Configure (see proxy/README.md):
//   secret  GEMINI_API_KEY     your key from https://aistudio.google.com/apikey
//   var     ALLOWED_ORIGINS    comma-separated, e.g. "https://your-name.github.io,http://localhost:5173"
//   var     ALLOWED_MODELS     optional comma-separated allowlist, e.g. "gemini-3.6-flash,gemini-3.5-flash-lite"
//
// Add a Cloudflare rate-limiting rule on the worker route to cap usage per IP.

const UPSTREAM = 'https://generativelanguage.googleapis.com';
const MAX_BODY = 15 * 1024 * 1024; // receipts are sent as base64 images

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
    const originOk = allowed.includes(origin);
    const cors = {
      'Access-Control-Allow-Origin': originOk ? origin : 'null',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin',
    };

    if (request.method === 'OPTIONS') return new Response(null, { status: originOk ? 204 : 403, headers: cors });
    if (!originOk) return json({ error: { message: 'Origin not allowed.' } }, 403, cors);
    if (!env.GEMINI_API_KEY) return json({ error: { message: 'Proxy is missing GEMINI_API_KEY.' } }, 500, cors);

    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'GET' && path === '/v1beta/models') {
      return forward(`${UPSTREAM}/v1beta/models?pageSize=200`, { method: 'GET' }, env, cors);
    }

    const m = path.match(/^\/v1beta\/models\/([a-zA-Z0-9.\-]+):(generateContent|streamGenerateContent)$/);
    if (request.method !== 'POST' || !m) return json({ error: { message: 'Not found.' } }, 404, cors);

    const [, model, method] = m;
    const models = (env.ALLOWED_MODELS || '').split(',').map((s) => s.trim()).filter(Boolean);
    if (models.length && !models.includes(model)) return json({ error: { message: `Model ${model} is not enabled on this proxy.` } }, 404, cors);

    const len = Number(request.headers.get('Content-Length') || 0);
    if (len > MAX_BODY) return json({ error: { message: 'Request too large.' } }, 413, cors);

    const qs = method === 'streamGenerateContent' && url.searchParams.get('alt') === 'sse' ? '?alt=sse' : '';
    return forward(`${UPSTREAM}/v1beta/models/${model}:${method}${qs}`, { method: 'POST', body: request.body }, env, cors);
  },
};

async function forward(target, init, env, cors) {
  const res = await fetch(target, {
    ...init,
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
  });
  const headers = new Headers(cors);
  headers.set('Content-Type', res.headers.get('Content-Type') || 'application/json');
  return new Response(res.body, { status: res.status, headers });
}

function json(body, status, cors) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}
