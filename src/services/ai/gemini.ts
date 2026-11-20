// Minimal Gemini REST client (generateContent API) for the browser.
//
// Two connection modes:
//  - key:   calls generativelanguage.googleapis.com directly with the user's own key in the
//           x-goog-api-key header (never in the URL). The key lives only in this browser.
//  - proxy: calls a proxy (see /proxy/cloudflare-worker.js) that adds the key server-side,
//           so a public deployment never ships a key to visitors.
//
// Gemini 3.x deprecates temperature/top_p/top_k, so no sampling parameters are sent.
import { aiReady, useAI } from '../../store/ai';

const DIRECT = 'https://generativelanguage.googleapis.com';

export interface Part {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}
export interface Message {
  role: 'user' | 'model';
  parts: Part[];
}

export class AIError extends Error {
  constructor(message: string, readonly kind: 'config' | 'auth' | 'quota' | 'blocked' | 'network' | 'bad-response' | 'model' = 'network') {
    super(message);
  }
}

interface Request {
  system?: string;
  messages: Message[];
  /** JSON Schema (lowercase types) for structured output. */
  schema?: Record<string, unknown>;
  signal?: AbortSignal;
}

function endpoint(model: string, method: string): { url: string; headers: Record<string, string> } {
  const s = useAI.getState();
  if (!aiReady(s)) throw new AIError('Connect Gemini in Settings → AI assistant first.', 'config');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (s.mode === 'key') {
    headers['x-goog-api-key'] = s.apiKey.trim();
    return { url: `${DIRECT}/v1beta/models/${encodeURIComponent(model)}:${method}`, headers };
  }
  const base = s.proxyUrl.trim().replace(/\/+$/, '');
  return { url: `${base}/v1beta/models/${encodeURIComponent(model)}:${method}`, headers };
}

// The JSON-schema field name has changed across API versions; remember which one works.
type SchemaField = 'responseJsonSchema' | 'responseSchema' | 'none';
let schemaField: SchemaField = 'responseJsonSchema';

function body(req: Request, field: SchemaField) {
  const generationConfig: Record<string, unknown> = {};
  if (req.schema) {
    generationConfig.responseMimeType = 'application/json';
    if (field === 'responseJsonSchema') generationConfig.responseJsonSchema = req.schema;
    if (field === 'responseSchema') generationConfig.responseSchema = toOpenApi(req.schema);
  }
  return JSON.stringify({
    contents: req.messages,
    ...(req.system ? { systemInstruction: { parts: [{ text: req.system }] } } : {}),
    ...(Object.keys(generationConfig).length ? { generationConfig } : {}),
  });
}

async function readError(res: Response): Promise<AIError> {
  let msg = '';
  try {
    const j = (await res.json()) as { error?: { message?: string; status?: string } };
    msg = j.error?.message ?? '';
  } catch {
    /* not JSON */
  }
  if (res.status === 400 && /api key/i.test(msg)) return new AIError('Gemini rejected the API key. Check it in Settings.', 'auth');
  if (res.status === 401 || res.status === 403) return new AIError('Gemini refused the request. Check the API key or proxy in Settings.', 'auth');
  if (res.status === 404) return new AIError(`Model not found. Pick another model in Settings. ${msg}`.trim(), 'model');
  if (res.status === 429) return new AIError('Gemini rate limit reached. Wait a minute and try again.', 'quota');
  return new AIError(msg || `Gemini returned an error (${res.status}).`, 'network');
}

function isSchemaFieldError(e: AIError): boolean {
  return /responseJsonSchema|responseSchema|response_json_schema|response_schema|Unknown name|Invalid JSON payload/i.test(e.message);
}

function extractText(data: unknown): string {
  const d = data as {
    candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] }; finishReason?: string }[];
    promptFeedback?: { blockReason?: string };
  };
  if (d.promptFeedback?.blockReason) throw new AIError('Gemini declined to answer that request.', 'blocked');
  const c = d.candidates?.[0];
  if (!c) return '';
  if (c.finishReason && ['SAFETY', 'PROHIBITED_CONTENT', 'BLOCKLIST'].includes(c.finishReason)) {
    throw new AIError('Gemini declined to answer that request.', 'blocked');
  }
  return (c.content?.parts ?? []).filter((p) => !p.thought && p.text).map((p) => p.text).join('');
}

/** One-shot generation. Returns the text. */
export async function generate(req: Request): Promise<string> {
  const model = useAI.getState().model;
  const { url, headers } = endpoint(model, 'generateContent');
  const attempt = async (field: SchemaField): Promise<string> => {
    let res: Response;
    try {
      res = await fetch(url, { method: 'POST', headers, body: body(req, field), signal: req.signal });
    } catch (e) {
      if ((e as Error).name === 'AbortError') throw e;
      throw new AIError('Could not reach Gemini. Check your connection (or the proxy URL).', 'network');
    }
    if (!res.ok) {
      const err = await readError(res);
      if (req.schema && res.status === 400 && field !== 'none' && isSchemaFieldError(err)) {
        const next: SchemaField = field === 'responseJsonSchema' ? 'responseSchema' : 'none';
        schemaField = next;
        return attempt(next);
      }
      throw err;
    }
    return extractText(await res.json());
  };
  return attempt(req.schema ? schemaField : 'none');
}

/** Structured generation: parses and returns JSON matching the schema. */
export async function generateJSON<T>(req: Request & { schema: Record<string, unknown> }): Promise<T> {
  const text = await generate(req);
  return parseJSON<T>(text);
}

export function parseJSON<T>(text: string): T {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.search(/[[{]/);
    const end = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as T;
      } catch {
        /* fall through */
      }
    }
    throw new AIError('Gemini returned something that was not valid JSON. Try again.', 'bad-response');
  }
}

/**
 * Streaming chat. Calls onText with the growing reply; resolves with the full text.
 * Falls back to a single request if streaming is not available (e.g. some proxies).
 */
export async function stream(req: Omit<Request, 'schema'>, onText: (full: string) => void): Promise<string> {
  const model = useAI.getState().model;
  const { url, headers } = endpoint(model, 'streamGenerateContent');
  let res: Response;
  try {
    res = await fetch(`${url}?alt=sse`, { method: 'POST', headers, body: body(req, 'none'), signal: req.signal });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    throw new AIError('Could not reach Gemini. Check your connection (or the proxy URL).', 'network');
  }
  if (!res.ok || !res.body) {
    if (res.status === 404 || res.status === 405) {
      const full = await generate(req);
      onText(full);
      return full;
    }
    throw await readError(res);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let full = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const events = buf.split(/\r?\n\r?\n/);
    buf = events.pop() ?? '';
    for (const ev of events) {
      const data = ev
        .split(/\r?\n/)
        .filter((l) => l.startsWith('data:'))
        .map((l) => l.slice(5).trim())
        .join('');
      if (!data || data === '[DONE]') continue;
      try {
        full += extractText(JSON.parse(data));
        onText(full);
      } catch (e) {
        if (e instanceof AIError) throw e;
      }
    }
  }
  if (!full) {
    // Some servers ignore alt=sse and return a JSON array instead.
    try {
      const arr = JSON.parse(buf) as unknown[];
      full = (Array.isArray(arr) ? arr : [arr]).map(extractText).join('');
      onText(full);
    } catch {
      /* nothing parsable */
    }
  }
  return full;
}

/** Live list of models the key can call with generateContent. */
export async function listModels(): Promise<string[]> {
  const s = useAI.getState();
  if (!aiReady(s)) throw new AIError('Connect Gemini first.', 'config');
  const base = s.mode === 'key' ? DIRECT : s.proxyUrl.trim().replace(/\/+$/, '');
  const headers: Record<string, string> = s.mode === 'key' ? { 'x-goog-api-key': s.apiKey.trim() } : {};
  const res = await fetch(`${base}/v1beta/models?pageSize=200`, { headers });
  if (!res.ok) throw await readError(res);
  const data = (await res.json()) as { models?: { name: string; supportedGenerationMethods?: string[] }[] };
  return (data.models ?? [])
    .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
    .map((m) => m.name.replace(/^models\//, ''))
    .filter((id) => /^gemini/.test(id))
    .sort();
}

/** Cheap round-trip to confirm the connection works. */
export async function testConnection(): Promise<string> {
  const text = await generate({ messages: [{ role: 'user', parts: [{ text: 'Reply with exactly: OK' }] }] });
  return text.trim();
}

/** JSON Schema (lowercase types) → OpenAPI-style schema (uppercase types) for the older field. */
function toOpenApi(s: unknown): unknown {
  if (Array.isArray(s)) return s.map(toOpenApi);
  if (!s || typeof s !== 'object') return s;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(s as Record<string, unknown>)) {
    if (k === 'type' && typeof v === 'string') out.type = v.toUpperCase();
    else if (k === 'additionalProperties' || k === '$schema') continue;
    else out[k] = toOpenApi(v);
  }
  return out;
}

export function fileToInlineData(file: File): Promise<Part> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const url = String(r.result);
      const comma = url.indexOf(',');
      resolve({ inlineData: { mimeType: file.type || 'image/jpeg', data: url.slice(comma + 1) } });
    };
    r.onerror = () => reject(new AIError('Could not read that file.', 'bad-response'));
    r.readAsDataURL(file);
  });
}
