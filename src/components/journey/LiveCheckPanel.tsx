import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, ExternalLink, Globe, RefreshCw, Search, Users, XCircle } from 'lucide-react';
import clsx from 'clsx';
import type { Trip } from '../../types';
import type { JourneyPlan } from '../../engine/journey';
import { cachedLiveCheck, liveCheckJourney, type Demand, type LiveCheck, type LiveService } from '../../services/ai/liveCheck';
import { AIError } from '../../services/ai/gemini';
import { useAIReady } from '../../store/ai';
import { AIConnectHint } from '../ai/AIConnectHint';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Fields';
import { Spinner } from '../ui/Spinner';

const DEMAND: Record<Demand, { label: string; tone: 'ok' | 'warn' | 'bad' | 'neutral' }> = {
  low: { label: 'Quiet date', tone: 'ok' },
  normal: { label: 'Normal demand', tone: 'neutral' },
  high: { label: 'Busy date, book early', tone: 'warn' },
  'very-high': { label: 'Very busy, book now', tone: 'bad' },
  unknown: { label: 'Demand unclear', tone: 'neutral' },
};

/** "Check live for <date>": Gemini searches the web for this exact journey and date. */
export function LiveCheckPanel({ trip, plan, autoRun }: { trip: Trip; plan: JourneyPlan; autoRun?: number }) {
  const ready = useAIReady();
  const [result, setResult] = useState<LiveCheck | null>(() => cachedLiveCheck(plan.legId, plan.date));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const ctrl = useRef<AbortController | null>(null);

  const run = async (force = false) => {
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    setBusy(true);
    setError('');
    try {
      const r = await liveCheckJourney(trip, plan, { force, signal: c.signal });
      if (!c.signal.aborted) setResult(r);
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      setError(e instanceof AIError || e instanceof Error ? e.message : 'The live check failed. Try again.');
    } finally {
      if (!c.signal.aborted) setBusy(false);
    }
  };

  useEffect(() => () => ctrl.current?.abort(), []);
  // "Check all journeys" from the travel guide bumps autoRun. Only react to presses that happen
  // after this card mounted, so a remount (e.g. after moving the trip) never spends quota by itself.
  const seenRun = useRef(autoRun ?? 0);
  useEffect(() => {
    if ((autoRun ?? 0) <= seenRun.current) return;
    seenRun.current = autoRun ?? 0;
    if (ready && !result && !busy) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun]);

  if (plan.kind === 'drive' || plan.kind === 'local') return null;
  if (!ready) return <AIConnectHint compact what="live checks for your travel date" />;

  const dayLabel = new Date(plan.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  const mins = result ? Math.max(0, Math.round((Date.now() - new Date(result.checkedAt).getTime()) / 60000)) : 0;

  return (
    <div className="rounded-xl border border-brand/25 bg-brand-soft/30">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Globe className="h-4 w-4 shrink-0 text-brand" />
          <span className="text-[13.5px] font-semibold">Live check for {dayLabel}</span>
          {result && <span className="text-[12px] text-muted">checked {mins ? `${mins} min ago` : 'just now'}</span>}
        </div>
        {busy ? (
          <span className="inline-flex items-center gap-2 text-[12.5px] text-muted">
            <Spinner className="h-4 w-4" /> Searching the web…
            <button type="button" className="font-medium text-brand hover:underline" onClick={() => { ctrl.current?.abort(); setBusy(false); }}>
              Cancel
            </button>
          </span>
        ) : result ? (
          <Button size="xs" variant="ghost" icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={() => run(true)}>
            Check again
          </Button>
        ) : (
          <Button size="sm" icon={<Search className="h-3.5 w-3.5" />} onClick={() => run()}>
            Check live with AI
          </Button>
        )}
      </div>

      {!result && !busy && !error && (
        <p className="border-t border-brand/15 px-4 py-2.5 text-[12.5px] text-muted">
          Gemini searches the web for this exact date: which trains or buses run, cancellations or diversions, strikes or weather, and how busy the date is. Seat counts are only on IRCTC and redBus.
        </p>
      )}
      {error && <p className="border-t border-brand/15 px-4 py-2.5 text-[13px] font-medium text-bad">{error}</p>}

      {result && (
        <div className="space-y-3 border-t border-brand/15 px-4 py-3">
          <p className="text-[13.5px] text-ink">{result.summary}</p>
          <div className="flex flex-wrap gap-1.5">
            <Badge tone={DEMAND[result.demand].tone}>
              <Users className="h-3 w-3" /> {DEMAND[result.demand].label}
            </Badge>
          </div>
          {result.demandNote && <p className="-mt-1 text-[12.5px] text-muted">{result.demandNote}</p>}

          {result.alerts.length > 0 && (
            <ul className="space-y-1.5">
              {result.alerts.map((a) => (
                <li key={a} className="flex items-start gap-2 rounded-lg bg-warn-soft px-3 py-2 text-[12.5px] text-warn">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {a}
                </li>
              ))}
            </ul>
          )}

          {result.services.length > 0 && (
            <ul className="divide-y divide-brand/10 overflow-hidden rounded-lg border border-brand/15 bg-surface">
              {result.services.map((s) => (
                <ServiceLine key={s.number || s.name} s={s} plan={plan} />
              ))}
            </ul>
          )}

          {result.recommendation && (
            <p className="flex items-start gap-2 text-[13px] font-medium">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ok" /> {result.recommendation}
            </p>
          )}

          {result.sources.length > 0 ? (
            <div>
              <div className="mb-1 text-[11.5px] font-semibold uppercase tracking-wide text-muted">Sources found</div>
              <div className="flex flex-wrap gap-1.5">
                {result.sources.slice(0, 8).map((src, i) => (
                  <a key={src.url} href={src.url} target="_blank" rel="noopener noreferrer" title={src.title} className="inline-flex max-w-[16rem] items-center gap-1 rounded-md border border-line-strong bg-surface px-2 py-0.5 text-[11.5px] text-ink-2 hover:bg-sunken">
                    <span className="tabular text-muted">{i + 1}</span>
                    <span className="truncate">{src.title}</span>
                    <ExternalLink className="h-3 w-3 shrink-0 text-muted" />
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-[12px] text-muted">Gemini didn't return web sources for this answer, so treat it with extra care.</p>
          )}
          <p className="text-[11.5px] text-muted">AI web results can be wrong or out of date. Confirm on IRCTC, NTES or the operator before you travel.</p>
        </div>
      )}
    </div>
  );
}

function ServiceLine({ s, plan }: { s: LiveService; plan: JourneyPlan }) {
  const known = [...plan.options, ...plan.alternatives].find((o) => (s.number ? o.number === s.number : o.name.toLowerCase() === s.name.toLowerCase()));
  const timeChanged = known?.departs && s.departs && known.departs !== s.departs;
  const bad = s.status === 'cancelled' || s.runsOnDate === 'no';
  return (
    <li className="flex items-start gap-2.5 px-3 py-2.5">
      {bad ? <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-bad" /> : s.status === 'normal' && s.runsOnDate === 'yes' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ok" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warn" />}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
          {s.number && <span className="rounded bg-ink px-1.5 py-0.5 font-mono text-[11.5px] font-semibold text-bg">{s.number}</span>}
          <span className="font-medium">{s.name}</span>
          {!s.known && <Badge tone="brand">Not in our data</Badge>}
          {s.status !== 'normal' && s.status !== 'unknown' && <Badge tone="bad">{s.status}</Badge>}
          {s.runsOnDate === 'no' && <Badge tone="bad">Not running this day</Badge>}
          {s.runsOnDate === 'unknown' && <Badge>Running unclear</Badge>}
        </div>
        {(s.departs || s.arrives) && (
          <div className={clsx('mt-0.5 text-[12px] tabular', timeChanged ? 'font-medium text-warn' : 'text-muted')}>
            {s.departs && `Departs ${s.departs}`} {s.arrives && `· arrives ${s.arrives}`}
            {timeChanged && ` (our timetable says ${known!.departs})`}
          </div>
        )}
        {s.note && <p className="mt-0.5 text-[12px] text-muted">{s.note}</p>}
      </div>
    </li>
  );
}
