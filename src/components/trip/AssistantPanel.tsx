// Trip assistant (phase 2): ask Gemini about the trip, or describe a change and apply it to the plan.
// Plan changes are previewed first and only applied when the user clicks Apply; the engine re-times them.
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import {
  ArrowRight, CalendarDays, Check, Copy, MessageSquarePlus, RotateCcw, Send, Sparkles, Square, Ticket, Users, Wallet, Wand2,
} from 'lucide-react';
import clsx from 'clsx';
import type { Trip } from '../../types';
import type { WorkspaceActions, WorkspaceTab } from './TripWorkspace';
import { chat, planEdits } from '../../services/ai/provider';
import { AIError, type Message } from '../../services/ai/gemini';
import { applyEdits, type EditOp } from '../../engine/aiEdits';
import { summarize } from '../../engine/expenses';
import { useAI, useAIReady } from '../../store/ai';
import { AIBadge, AIConnectHint } from '../ai/AIConnectHint';
import { Markdown } from '../ai/Markdown';
import { Avatar, AvatarStack, Card } from '../ui/Kit';
import { Badge, Segmented } from '../ui/Fields';
import { Button, IconButton } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { inr, plural, uid } from '../../lib/format';
import { fmtDate, fmtDuration } from '../../lib/time';

type Mode = 'ask' | 'edit';
const MAX_CHARS = 2000;

interface ChatMsg {
  id: string;
  role: 'user' | 'model';
  text: string;
  stopped?: boolean;
}

interface Failure {
  message: string;
  kind: AIError['kind'] | 'other';
}

function toFailure(e: unknown): Failure {
  if (e instanceof AIError) return { message: e.message, kind: e.kind };
  return { message: (e as Error)?.message || 'Something went wrong. Try again.', kind: 'other' };
}

const isAbort = (e: unknown) => (e as Error)?.name === 'AbortError';

export function AssistantPanel({ trip, actions, onNavigate }: { trip: Trip; actions: WorkspaceActions; onNavigate: (tab: WorkspaceTab, extra?: Record<string, string>) => void }) {
  const ready = useAIReady();
  const model = useAI((s) => s.model);
  const [mode, setMode] = useState<Mode>('ask');

  if (!ready) return <NotConnected />;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      <section className="card flex min-w-0 flex-col overflow-hidden">
        {mode === 'ask' ? (
          <ChatView trip={trip} mode={mode} onMode={setMode} model={model} />
        ) : (
          <EditView trip={trip} actions={actions} onNavigate={onNavigate} mode={mode} onMode={setMode} model={model} />
        )}
      </section>
      <ContextCard trip={trip} onNavigate={onNavigate} />
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Not connected

function NotConnected() {
  const items = [
    ['Answer questions about your trip', 'Budget, who owes whom, what to pack, the weather to expect.'],
    ['Change the plan in plain words', '"Swap the fort on day 3 for a beach." You preview every change before it applies.'],
    ['Suggest places', 'Real spots near each destination that fit your group and budget.'],
    ['Read receipts', 'Snap a bill or UPI screenshot to fill in an expense.'],
  ];
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <AIConnectHint what="the trip assistant" className="bg-surface" />
      <Card title="What the assistant can do">
        <ul className="space-y-3.5">
          {items.map(([t, d]) => (
            <li key={t} className="flex gap-3">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-warn-soft text-accent">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <span>
                <span className="block text-[13.5px] font-medium">{t}</span>
                <span className="block text-[12.5px] text-muted">{d}</span>
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Shared header + composer

function PanelHeader({ mode, onMode, model, right }: { mode: Mode; onMode: (m: Mode) => void; model: string; right?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-warn-soft text-accent">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-[14px] font-semibold">Trip assistant</h2>
            <AIBadge />
          </div>
          <div className="truncate text-[12px] text-muted">{model}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Segmented<Mode>
          label="Assistant mode"
          value={mode}
          onChange={onMode}
          options={[
            { value: 'ask', label: 'Ask' },
            { value: 'edit', label: 'Change the plan' },
          ]}
        />
        {right}
      </div>
    </header>
  );
}

function Composer({
  value, onChange, onSubmit, disabled, busy, onStop, placeholder, submitLabel, id,
}: {
  value: string; onChange: (v: string) => void; onSubmit: () => void; disabled?: boolean; busy?: boolean; onStop?: () => void;
  placeholder: string; submitLabel: string; id: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(200, el.scrollHeight)}px`;
  }, [value]);

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (!disabled && !busy && value.trim()) onSubmit();
    }
  };

  return (
    <div className="border-t border-line bg-sunken/40 p-3 sm:p-4">
      <div className="rounded-xl border border-line-strong bg-surface shadow-card focus-within:border-brand focus-within:ring-[3px] focus-within:ring-brand/15">
        <label htmlFor={id} className="sr-only">
          {placeholder}
        </label>
        <textarea
          ref={ref}
          id={id}
          rows={1}
          value={value}
          maxLength={MAX_CHARS}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKey}
          placeholder={placeholder}
          className="block max-h-[200px] w-full resize-none bg-transparent px-3.5 pt-3 text-[14px] leading-relaxed outline-none placeholder:text-muted/80 disabled:opacity-60"
        />
        <div className="flex items-center justify-between gap-2 px-2.5 pb-2.5 pt-1">
          <span className="pl-1 text-[11.5px] text-muted">
            {value.length > MAX_CHARS * 0.8 ? `${value.length}/${MAX_CHARS}` : <span className="hidden sm:inline">Enter to send · Shift+Enter for a new line</span>}
          </span>
          {busy && onStop ? (
            <Button size="sm" variant="secondary" icon={<Square className="h-3.5 w-3.5 fill-current" />} onClick={onStop}>
              Stop
            </Button>
          ) : (
            <Button size="sm" icon={submitLabel === 'Send' ? <Send className="h-3.5 w-3.5" /> : <Wand2 className="h-3.5 w-3.5" />} disabled={disabled || busy || !value.trim()} onClick={onSubmit}>
              {submitLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Footnote({ model }: { model: string }) {
  return (
    <p className="px-4 pb-3 text-center text-[11.5px] text-muted sm:px-5">
      Gemini can make mistakes. Check prices, timings and opening hours locally. Model: {model}.
    </p>
  );
}

function ErrorBox({ failure, onRetry }: { failure: Failure; onRetry?: () => void }) {
  if (failure.kind === 'config') return <AIConnectHint compact what="the trip assistant" className="px-1" />;
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 rounded-lg border border-bad/25 bg-bad-soft px-3 py-2.5 text-[13px] text-bad">
      <span className="min-w-0 flex-1">{failure.message}</span>
      {onRetry && (
        <Button size="xs" variant="secondary" icon={<RotateCcw className="h-3.5 w-3.5" />} onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Ask mode

function storageKey(tripId: string) {
  return `itinera-chat-${tripId}`;
}

function loadChat(tripId: string): ChatMsg[] {
  try {
    const raw = sessionStorage.getItem(storageKey(tripId));
    const parsed = raw ? (JSON.parse(raw) as ChatMsg[]) : [];
    return Array.isArray(parsed) ? parsed.filter((m) => m && (m.role === 'user' || m.role === 'model') && typeof m.text === 'string') : [];
  } catch {
    return [];
  }
}

function saveChat(tripId: string, msgs: ChatMsg[]) {
  try {
    if (msgs.length) sessionStorage.setItem(storageKey(tripId), JSON.stringify(msgs.slice(-60)));
    else sessionStorage.removeItem(storageKey(tripId));
  } catch {
    /* storage unavailable: the chat just isn't remembered */
  }
}

/** Gemini expects alternating turns; merge consecutive messages from the same side. */
function toHistory(msgs: ChatMsg[]): Message[] {
  const out: Message[] = [];
  msgs.forEach((m) => {
    const text = m.text.trim();
    if (!text) return;
    const last = out[out.length - 1];
    if (last && last.role === m.role) last.parts[0].text = `${last.parts[0].text}\n\n${text}`;
    else out.push({ role: m.role, parts: [{ text }] });
  });
  // The conversation must start with the user.
  while (out.length && out[0].role !== 'user') out.shift();
  return out;
}

function suggestedPrompts(trip: Trip): string[] {
  const dests = trip.input.destinations;
  const first = dests[0]?.name ?? 'the first stop';
  const last = dests[dests.length - 1]?.name ?? first;
  const D = trip.days.length;
  const relaxedDay = Math.min(3, Math.max(1, D - 1));
  return [
    `What should we pack for ${last}?`,
    'How are we doing on budget?',
    `Suggest a cheaper way to get back to ${trip.input.origin.name}`,
    `Plan a relaxed day ${relaxedDay}`,
    'Who owes whom right now?',
    `Best local food to try in ${first}`,
  ];
}

function ChatView({ trip, mode, onMode, model }: { trip: Trip; mode: Mode; onMode: (m: Mode) => void; model: string }) {
  const toast = useToast();
  const [msgs, setMsgs] = useState<ChatMsg[]>(() => loadChat(trip.id));
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState('');
  const [failure, setFailure] = useState<Failure | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const ctrlRef = useRef<AbortController | null>(null);
  const draftRef = useRef('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const tripRef = useRef(trip);
  tripRef.current = trip;

  useEffect(() => saveChat(trip.id, msgs), [trip.id, msgs]);
  useEffect(() => () => ctrlRef.current?.abort(), []);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, draft, busy, failure]);

  const run = async (history: ChatMsg[]) => {
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setBusy(true);
    setFailure(null);
    setDraft('');
    draftRef.current = '';
    try {
      const full = await chat(
        tripRef.current,
        toHistory(history),
        (t) => {
          draftRef.current = t;
          setDraft(t);
        },
        ctrl.signal,
      );
      setMsgs((m) => [...m, { id: uid('m_'), role: 'model', text: full.trim() || "I couldn't come up with an answer. Try rephrasing." }]);
    } catch (e) {
      if (isAbort(e)) {
        const partial = draftRef.current.trim();
        if (partial) setMsgs((m) => [...m, { id: uid('m_'), role: 'model', text: partial, stopped: true }]);
      } else {
        const partial = draftRef.current.trim();
        if (partial) setMsgs((m) => [...m, { id: uid('m_'), role: 'model', text: partial, stopped: true }]);
        setFailure(toFailure(e));
      }
    } finally {
      if (ctrlRef.current === ctrl) ctrlRef.current = null;
      setBusy(false);
      setDraft('');
      draftRef.current = '';
    }
  };

  const send = (text: string) => {
    const t = text.trim().slice(0, MAX_CHARS);
    if (!t || busy) return;
    const next = [...msgs, { id: uid('m_'), role: 'user' as const, text: t }];
    setMsgs(next);
    setInput('');
    void run(next);
  };

  const retry = () => {
    if (busy) return;
    // Drop a trailing partial answer so the retry starts from the last question.
    const trimmed = msgs[msgs.length - 1]?.role === 'model' && msgs[msgs.length - 1].stopped ? msgs.slice(0, -1) : msgs;
    setMsgs(trimmed);
    void run(trimmed);
  };

  const copy = async (m: ChatMsg) => {
    try {
      await navigator.clipboard.writeText(m.text);
      setCopied(m.id);
      setTimeout(() => setCopied((c) => (c === m.id ? null : c)), 1500);
    } catch {
      toast('Copy is blocked here. Select the text and copy it manually.', 'error');
    }
  };

  const reset = () => {
    ctrlRef.current?.abort();
    setMsgs([]);
    setFailure(null);
    setInput('');
  };

  const me = trip.travelers[0] ?? { name: 'You', color: '#2557d6' };
  const prompts = useMemo(() => suggestedPrompts(trip), [trip]);
  const empty = msgs.length === 0 && !busy;

  return (
    <>
      <PanelHeader
        mode={mode}
        onMode={onMode}
        model={model}
        right={
          <IconButton label="New chat" onClick={reset} disabled={msgs.length === 0 && !busy}>
            <MessageSquarePlus className="h-4 w-4" />
          </IconButton>
        }
      />
      <div ref={scrollRef} className="h-[min(62vh,600px)] min-h-[320px] overflow-y-auto px-4 py-5 sm:px-5" aria-live="polite">
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-warn-soft text-accent">
              <Sparkles className="h-5 w-5" />
            </span>
            <h3 className="mt-3 text-[15px] font-semibold">Ask anything about {trip.input.name}</h3>
            <p className="mt-1 max-w-[48ch] text-[13px] text-muted">The assistant sees your itinerary, budget, expenses and bookings. It won't change anything unless you switch to Change the plan.</p>
            <div className="mt-5 flex max-w-xl flex-wrap justify-center gap-2">
              {prompts.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => send(p)}
                  className="rounded-full border border-line-strong bg-surface px-3 py-1.5 text-left text-[12.5px] font-medium text-ink-2 shadow-card transition-colors hover:border-brand hover:text-ink"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ol className="space-y-5">
            {msgs.map((m) =>
              m.role === 'user' ? (
                <li key={m.id} className="flex justify-end gap-2.5">
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-md bg-brand px-3.5 py-2.5 text-[14px] leading-relaxed text-brand-ink [overflow-wrap:anywhere]">{m.text}</div>
                  <span className="hidden sm:block">
                    <Avatar person={me} size={28} />
                  </span>
                </li>
              ) : (
                <li key={m.id} className="group flex gap-2.5">
                  <AssistantAvatar />
                  <div className="min-w-0 max-w-[92%] flex-1">
                    <div className="rounded-2xl rounded-tl-md border border-line bg-sunken/50 px-3.5 py-2.5">
                      <Markdown text={m.text} />
                      {m.stopped && <p className="mt-2 text-[12px] italic text-muted">Stopped before finishing.</p>}
                    </div>
                    <div className="mt-1 flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                      <button type="button" onClick={() => copy(m)} className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[12px] text-muted hover:bg-sunken hover:text-ink">
                        {copied === m.id ? <Check className="h-3.5 w-3.5 text-ok" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied === m.id ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </li>
              ),
            )}
            {busy && (
              <li className="flex gap-2.5">
                <AssistantAvatar />
                <div className="min-w-0 max-w-[92%] flex-1 rounded-2xl rounded-tl-md border border-line bg-sunken/50 px-3.5 py-2.5">
                  {draft ? <Markdown text={draft} /> : <TypingDots />}
                </div>
              </li>
            )}
            {failure && !busy && (
              <li>
                <ErrorBox failure={failure} onRetry={msgs[msgs.length - 1]?.role === 'user' || msgs[msgs.length - 1]?.stopped ? retry : undefined} />
              </li>
            )}
          </ol>
        )}
      </div>
      <Composer
        id="assistant-ask"
        value={input}
        onChange={setInput}
        onSubmit={() => send(input)}
        busy={busy}
        onStop={() => ctrlRef.current?.abort()}
        placeholder="Ask about your trip…"
        submitLabel="Send"
      />
      <Footnote model={model} />
    </>
  );
}

function AssistantAvatar() {
  return (
    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-warn-soft text-accent ring-1 ring-inset ring-accent/20">
      <Sparkles className="h-3.5 w-3.5" />
    </span>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1.5" aria-label="Assistant is typing">
      {[0, 150, 300].map((d) => (
        <span key={d} className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted" style={{ animationDelay: `${d}ms` }} />
      ))}
    </span>
  );
}

// ---------------------------------------------------------------------------------------------
// Change-the-plan mode

function editPrompts(trip: Trip): string[] {
  const D = trip.days.length;
  const mid = Math.min(2, D);
  const late = Math.max(1, D - 1);
  const last = trip.input.destinations[trip.input.destinations.length - 1]?.name ?? 'the last stop';
  return [
    `Make day ${mid} more relaxed`,
    `Add a good sunset spot to day ${mid}`,
    `Remove the optional stops on day ${late}`,
    `Add a local food stop in ${last}`,
  ];
}

function EditView({
  trip, actions, onNavigate, mode, onMode, model,
}: {
  trip: Trip; actions: WorkspaceActions; onNavigate: (tab: WorkspaceTab, extra?: Record<string, string>) => void; mode: Mode; onMode: (m: Mode) => void; model: string;
}) {
  const toast = useToast();
  const [request, setRequest] = useState('');
  const [asked, setAsked] = useState('');
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [result, setResult] = useState<{ summary: string; ops: EditOp[] } | null>(null);
  const [applied, setApplied] = useState(false);
  const ctrlRef = useRef<AbortController | null>(null);

  useEffect(() => () => ctrlRef.current?.abort(), []);

  const preview = async (text = request) => {
    const t = text.trim().slice(0, MAX_CHARS);
    if (!t || busy) return;
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setBusy(true);
    setFailure(null);
    setResult(null);
    setApplied(false);
    setAsked(t);
    try {
      const r = await planEdits(trip, t, ctrl.signal);
      setResult(r);
      setRequest('');
    } catch (e) {
      if (!isAbort(e)) setFailure(toFailure(e));
    } finally {
      if (ctrlRef.current === ctrl) ctrlRef.current = null;
      setBusy(false);
    }
  };

  const apply = () => {
    if (!result?.ops.length) return;
    const { days, newPlaces } = applyEdits(trip, result.ops);
    newPlaces.forEach((p) => actions.addPlace(p.destinationId, p.place));
    actions.setDays(days);
    setApplied(true);
    toast(`Applied ${plural(result.ops.length, 'change')} to the itinerary.`);
  };

  const discard = () => {
    setResult(null);
    setApplied(false);
    setFailure(null);
    setAsked('');
  };

  return (
    <>
      <PanelHeader mode={mode} onMode={onMode} model={model} />
      <div className="min-h-[320px] px-4 py-5 sm:px-5">
        {!result && !busy && !failure && (
          <div className="flex flex-col items-center py-6 text-center">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand">
              <Wand2 className="h-5 w-5" />
            </span>
            <h3 className="mt-3 text-[15px] font-semibold">Describe a change to your itinerary</h3>
            <p className="mt-1 max-w-[50ch] text-[13px] text-muted">
              You'll see exactly what would be added, removed or moved before anything changes. Times are recalculated by the planner.
            </p>
            <div className="mt-5 flex max-w-xl flex-wrap justify-center gap-2">
              {editPrompts(trip).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => preview(p)}
                  className="rounded-full border border-line-strong bg-surface px-3 py-1.5 text-[12.5px] font-medium text-ink-2 shadow-card transition-colors hover:border-brand hover:text-ink"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {(busy || result || failure) && asked && (
          <div className="mb-4 flex justify-end">
            <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-md bg-brand px-3.5 py-2.5 text-[14px] text-brand-ink [overflow-wrap:anywhere]">{asked}</div>
          </div>
        )}

        {busy && (
          <div className="flex items-center gap-2.5 rounded-xl border border-line bg-sunken/50 px-4 py-3 text-[13.5px] text-muted">
            <AssistantAvatar />
            Working out the changes…
            <span className="ml-auto">
              <Button size="xs" variant="secondary" icon={<Square className="h-3 w-3 fill-current" />} onClick={() => ctrlRef.current?.abort()}>
                Stop
              </Button>
            </span>
          </div>
        )}

        {failure && !busy && <ErrorBox failure={failure} onRetry={asked ? () => preview(asked) : undefined} />}

        {result && !busy && (
          <div className="animate-in space-y-4">
            <div className="flex gap-2.5">
              <AssistantAvatar />
              <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md border border-line bg-sunken/50 px-3.5 py-2.5">
                <Markdown text={result.summary || (result.ops.length ? 'Here are the proposed changes.' : 'No changes were needed.')} />
              </div>
            </div>

            {result.ops.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-line">
                <div className="flex items-center justify-between gap-2 border-b border-line bg-sunken/60 px-4 py-2.5">
                  <span className="text-[13px] font-semibold">
                    {applied ? 'Applied' : 'Proposed'} {plural(result.ops.length, 'change')}
                  </span>
                  {applied && (
                    <Badge tone="ok">
                      <Check className="h-3 w-3" /> Saved to itinerary
                    </Badge>
                  )}
                </div>
                <ul className="divide-y divide-line">
                  {result.ops.map((op, i) => (
                    <OpRow key={i} op={op} />
                  ))}
                </ul>
              </div>
            ) : (
              <p className="rounded-lg bg-sunken px-3.5 py-2.5 text-[13px] text-muted">Nothing to apply. Try describing the change differently, naming the day and the place.</p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {applied ? (
                <>
                  <Button icon={<CalendarDays className="h-4 w-4" />} onClick={() => onNavigate('plan')}>
                    View itinerary
                  </Button>
                  <Button variant="secondary" onClick={discard}>
                    Make another change
                  </Button>
                </>
              ) : (
                <>
                  {result.ops.length > 0 && (
                    <Button icon={<Check className="h-4 w-4" />} onClick={apply}>
                      Apply changes
                    </Button>
                  )}
                  <Button variant="secondary" onClick={discard}>
                    Discard
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      <Composer
        id="assistant-edit"
        value={request}
        onChange={setRequest}
        onSubmit={() => preview()}
        busy={busy}
        onStop={() => ctrlRef.current?.abort()}
        placeholder='e.g. "Swap the fort on day 3 for Dudhsagar Falls"'
        submitLabel="Preview changes"
      />
      <Footnote model={model} />
    </>
  );
}

function OpRow({ op }: { op: EditOp }) {
  const day = (i: number) => `Day ${i + 1}`;
  let badge: ReactNode;
  let title: string;
  let where: string;
  let meta: string | undefined;
  if (op.op === 'add') {
    badge = <Badge tone="ok">Add</Badge>;
    title = op.place.name;
    where = day(op.dayIndex);
    meta = [fmtDuration(op.place.durationMin), op.place.cost ? `${inr(op.place.cost)} per person` : 'Free'].join(' · ');
  } else if (op.op === 'remove') {
    badge = <Badge tone="bad">Remove</Badge>;
    title = op.title;
    where = day(op.dayIndex);
  } else {
    badge = <Badge tone="brand">Move</Badge>;
    title = op.title;
    where = `${day(op.dayIndex)} → ${day(op.toDayIndex)}`;
  }
  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <span className="mt-0.5 w-16 shrink-0">{badge}</span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-[13.5px] font-medium [overflow-wrap:anywhere]">{title}</span>
          <span className="text-[12px] font-medium text-muted">{where}</span>
        </div>
        {meta && <div className="text-[12px] text-muted">{meta}</div>}
        {op.reason && <div className="mt-0.5 text-[12.5px] text-ink-2">{op.reason}</div>}
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------------------------
// Context sidebar

function ContextCard({ trip, onNavigate }: { trip: Trip; onNavigate: (tab: WorkspaceTab, extra?: Record<string, string>) => void }) {
  const s = useMemo(() => summarize(trip), [trip]);
  const over = s.remaining < 0;
  const links: { tab: WorkspaceTab; label: string; icon: typeof CalendarDays }[] = [
    { tab: 'plan', label: 'Itinerary', icon: CalendarDays },
    { tab: 'expenses', label: 'Expenses', icon: Wallet },
    { tab: 'budget', label: 'Budget', icon: Wallet },
    { tab: 'bookings', label: 'Bookings', icon: Ticket },
  ];
  return (
    <aside className="hidden space-y-6 xl:block">
      <Card title="What I know" subtitle="The assistant reads this trip's live data">
        <dl className="space-y-3 text-[13px]">
          <Row icon={<CalendarDays className="h-4 w-4" />} label="Dates">
            {fmtDate(trip.input.startDate)} – {fmtDate(trip.days[trip.days.length - 1]?.date ?? trip.input.startDate)}
            <span className="block text-[12px] text-muted">{plural(trip.days.length, 'day')}</span>
          </Row>
          <Row icon={<Users className="h-4 w-4" />} label="Travellers">
            <span className="flex items-center gap-2">
              <AvatarStack people={trip.travelers} size={20} />
              {trip.travelers.length}
            </span>
          </Row>
          <Row icon={<Wallet className="h-4 w-4" />} label={over ? 'Over budget' : 'Budget left'}>
            <span className={clsx('font-semibold tabular', over ? 'text-bad' : 'text-ok')}>{inr(Math.abs(s.remaining))}</span>
            <span className="block text-[12px] text-muted">
              {inr(s.spent)} spent of {inr(s.cap)}
            </span>
          </Row>
          <Row icon={<Ticket className="h-4 w-4" />} label="Logged">
            {plural(trip.expenses.length, 'expense')}, {plural(trip.bookings.length, 'booking')}
          </Row>
        </dl>
      </Card>
      <Card title="Jump to" bodyClass="p-2">
        <ul>
          {links.map(({ tab, label, icon: Icon }) => (
            <li key={tab}>
              <button
                type="button"
                onClick={() => onNavigate(tab)}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] text-ink-2 hover:bg-sunken hover:text-ink"
              >
                <Icon className="h-4 w-4 text-muted" />
                <span className="flex-1">{label}</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted" />
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </aside>
  );
}

function Row({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 text-muted">{icon}</span>
      <div className="min-w-0">
        <dt className="text-[12px] text-muted">{label}</dt>
        <dd className="text-ink">{children}</dd>
      </div>
    </div>
  );
}
