import { useState } from 'react';
import { CheckCircle2, ExternalLink, Eye, EyeOff, KeyRound, RefreshCw, Server, ShieldCheck, XCircle } from 'lucide-react';
import clsx from 'clsx';
import { aiReady, DEFAULT_MODEL, SUGGESTED_MODELS, useAI, type AIMode } from '../../store/ai';
import { listModels, testConnection, AIError } from '../../services/ai/gemini';
import { Button } from '../ui/Button';
import { Segmented } from '../ui/Fields';
import { Spinner } from '../ui/Spinner';

/** Connection settings for Gemini: personal key (browser only) or a server-side proxy. */
export function AISettings() {
  const ai = useAI();
  const [show, setShow] = useState(false);
  const [keyDraft, setKeyDraft] = useState(ai.apiKey);
  const [proxyDraft, setProxyDraft] = useState(ai.proxyUrl);
  const [status, setStatus] = useState<{ kind: 'idle' | 'testing' | 'ok' | 'error'; text?: string }>({ kind: 'idle' });
  const [loadingModels, setLoadingModels] = useState(false);

  const save = () => ai.set({ apiKey: keyDraft.trim(), proxyUrl: proxyDraft.trim() });

  const test = async () => {
    save();
    setStatus({ kind: 'testing' });
    try {
      const reply = await testConnection();
      setStatus({ kind: 'ok', text: `Connected to ${useAI.getState().model}${reply && reply !== 'OK' ? ` (replied “${reply.slice(0, 40)}”)` : ''}.` });
    } catch (e) {
      setStatus({ kind: 'error', text: e instanceof AIError ? e.message : 'Connection failed. Check the details and try again.' });
    }
  };

  const loadModels = async () => {
    save();
    setLoadingModels(true);
    try {
      const models = await listModels();
      ai.set({ availableModels: models });
      setStatus({ kind: 'ok', text: `Found ${models.length} Gemini models for this key.` });
    } catch (e) {
      setStatus({ kind: 'error', text: e instanceof AIError ? e.message : 'Could not load models.' });
    } finally {
      setLoadingModels(false);
    }
  };

  const modelOptions = Array.from(new Set([...SUGGESTED_MODELS.map((m) => m.id), ...ai.availableModels, ai.model]));
  const ready = aiReady({ mode: ai.mode, apiKey: keyDraft, proxyUrl: proxyDraft });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented<AIMode>
          label="AI connection"
          value={ai.mode}
          onChange={(m) => {
            ai.set({ mode: m });
            setStatus({ kind: 'idle' });
          }}
          options={[
            { value: 'off', label: 'Off' },
            { value: 'key', label: 'My API key' },
            { value: 'proxy', label: 'Proxy server' },
          ]}
        />
        <span className={clsx('inline-flex items-center gap-1.5 text-[12.5px] font-medium', aiReady(ai) ? 'text-ok' : 'text-muted')}>
          <span className={clsx('h-2 w-2 rounded-full', aiReady(ai) ? 'bg-ok' : 'bg-line-strong')} />
          {aiReady(ai) ? 'AI features on' : 'AI features off'}
        </span>
      </div>

      {ai.mode === 'key' && (
        <div className="space-y-3">
          <label htmlFor="ai-key" className="label">
            Gemini API key
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                id="ai-key"
                type={show ? 'text' : 'password'}
                autoComplete="off"
                spellCheck={false}
                className="input pl-9 pr-10 font-mono text-[13px]"
                placeholder="Paste your key from Google AI Studio"
                value={keyDraft}
                onChange={(e) => setKeyDraft(e.target.value)}
                onBlur={save}
              />
              <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide key' : 'Show key'} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-ink">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {ai.apiKey && (
              <Button
                variant="secondary"
                onClick={() => {
                  ai.clearKey();
                  setKeyDraft('');
                  setStatus({ kind: 'idle' });
                }}
              >
                Remove
              </Button>
            )}
          </div>
          <div className="flex items-start gap-2 rounded-lg bg-sunken px-3 py-2.5 text-[12.5px] text-ink-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ok" />
            <p>
              The key is saved only in this browser and sent only to Google's Gemini API, in a request header. It is never included in backups, exports or share links. Anyone who can use this browser profile can use it, so don't set it on a shared computer.{' '}
              <a className="font-medium text-brand hover:underline" href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">
                Get a key in Google AI Studio <ExternalLink className="inline h-3 w-3" />
              </a>
            </p>
          </div>
        </div>
      )}

      {ai.mode === 'proxy' && (
        <div className="space-y-3">
          <label htmlFor="ai-proxy" className="label">
            Proxy URL
          </label>
          <div className="relative">
            <Server className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              id="ai-proxy"
              type="url"
              className="input pl-9 font-mono text-[13px]"
              placeholder="https://itinera-ai.your-name.workers.dev"
              value={proxyDraft}
              onChange={(e) => setProxyDraft(e.target.value)}
              onBlur={save}
            />
          </div>
          <p className="hint">
            The proxy keeps the Gemini key on a server, so the public site can offer AI without exposing it. Deploy <code className="rounded bg-sunken px-1 font-mono text-[12px]">proxy/cloudflare-worker.js</code> from the repository (see the README), then paste its URL. Must start with https://.
          </p>
        </div>
      )}

      {ai.mode !== 'off' && (
        <>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div>
              <label htmlFor="ai-model" className="label">
                Model
              </label>
              <select id="ai-model" className="input" value={ai.model} onChange={(e) => ai.set({ model: e.target.value })}>
                {modelOptions.map((id) => {
                  const known = SUGGESTED_MODELS.find((m) => m.id === id);
                  return (
                    <option key={id} value={id}>
                      {known ? `${known.label} · ${known.note}` : id}
                    </option>
                  );
                })}
              </select>
            </div>
            <Button variant="secondary" icon={loadingModels ? <Spinner className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />} onClick={loadModels} disabled={!ready || loadingModels}>
              Load my models
            </Button>
          </div>
          {ai.model !== DEFAULT_MODEL && (
            <button type="button" className="text-[12.5px] text-muted hover:text-ink" onClick={() => ai.set({ model: DEFAULT_MODEL })}>
              Reset to the recommended model ({DEFAULT_MODEL})
            </button>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={test} disabled={!ready || status.kind === 'testing'} icon={status.kind === 'testing' ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : undefined}>
              Test connection
            </Button>
            {status.kind === 'ok' && (
              <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ok">
                <CheckCircle2 className="h-4 w-4" /> {status.text}
              </span>
            )}
            {status.kind === 'error' && (
              <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-bad">
                <XCircle className="h-4 w-4" /> {status.text}
              </span>
            )}
          </div>
          <p className="text-[12.5px] text-muted">Each AI action sends the trip details it needs (destinations, dates, itinerary, budget and expenses) to Gemini. Receipt photos are sent only when you scan one.</p>
        </>
      )}
    </div>
  );
}
