import { useEffect, useRef, useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import type { Destination, Place, TripInput } from '../../types';
import { suggestPlaces } from '../../services/ai/provider';
import { AIError } from '../../services/ai/gemini';
import { useAIReady } from '../../store/ai';
import { AIBadge, AIConnectHint } from './AIConnectHint';
import { Button } from '../ui/Button';
import { INTEREST_LABEL } from '../options';
import { inr } from '../../lib/format';
import { fmtDuration } from '../../lib/time';

/** Gemini place ideas for one of the trip's destinations. */
export function AiPlaceIdeas({
  destinations, defaultDestinationId, input, onAdd,
}: {
  destinations: Destination[];
  defaultDestinationId: string;
  input: TripInput;
  onAdd: (destinationId: string, place: Place) => void;
}) {
  const ready = useAIReady();
  const [destId, setDestId] = useState(defaultDestinationId);
  const [request, setRequest] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ideas, setIdeas] = useState<Place[] | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const ctrl = useRef<AbortController | null>(null);

  useEffect(() => () => ctrl.current?.abort(), []);

  const dest = destinations.find((d) => d.id === destId) ?? destinations[0];

  const run = async () => {
    if (!dest) return;
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    setLoading(true);
    setError('');
    setIdeas(null);
    try {
      const res = await suggestPlaces(dest, input, { request: request.trim() || undefined, count: 8, signal: c.signal });
      if (c.signal.aborted) return;
      setIdeas(res);
      if (!res.length) setError('Gemini returned no usable places near this destination. Try describing what you want differently.');
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      setError(e instanceof AIError ? e.message : 'Something went wrong getting ideas. Try again.');
    } finally {
      if (ctrl.current === c) setLoading(false);
    }
  };

  if (!ready) return <AIConnectHint compact what="AI place ideas" className="py-4" />;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-[12.5px] text-muted">
        <AIBadge /> Real places suggested by Gemini. Check hours and fees locally.
      </div>
      <div className="grid gap-2 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)]">
        {destinations.length > 1 && (
          <div>
            <label htmlFor="ai-dest" className="sr-only">
              Destination
            </label>
            <select id="ai-dest" className="input" value={destId} onChange={(e) => setDestId(e.target.value)}>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className={destinations.length > 1 ? '' : 'sm:col-span-2'}>
          <label htmlFor="ai-request" className="sr-only">
            What are you in the mood for?
          </label>
          <input
            id="ai-request"
            className="input"
            placeholder="What are you in the mood for? e.g. hidden beaches, street food, a waterfall trek"
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (!loading) run();
              }
            }}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button icon={<Sparkles className="h-4 w-4" />} onClick={run} disabled={loading}>
          {loading ? 'Getting ideas…' : ideas ? 'Get new ideas' : 'Get ideas'}
        </Button>
        {loading && (
          <Button variant="ghost" onClick={() => { ctrl.current?.abort(); setLoading(false); }}>
            Cancel
          </Button>
        )}
      </div>

      {error && <p className="rounded-lg bg-bad-soft px-3 py-2 text-[13px] font-medium text-bad">{error}</p>}

      {loading && (
        <ul className="divide-y divide-line rounded-lg border border-line" aria-busy="true" aria-label="Loading ideas">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="flex items-center gap-3 px-3 py-3">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3.5 w-2/5 animate-pulse rounded bg-sunken" />
                <div className="h-3 w-4/5 animate-pulse rounded bg-sunken" />
              </div>
              <div className="h-8 w-16 animate-pulse rounded-lg bg-sunken" />
            </li>
          ))}
        </ul>
      )}

      {ideas && ideas.length > 0 && !loading && (
        <ul className="divide-y divide-line rounded-lg border border-line">
          {ideas.map((p) => {
            const done = added.has(p.id);
            return (
              <li key={p.id} className="flex items-start gap-3 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-[12.5px] text-muted">
                    {INTEREST_LABEL[p.category]} · {fmtDuration(p.durationMin)}
                    {p.cost > 0 ? ` · ${inr(p.cost)}` : ' · Free'}
                  </div>
                  {p.note && <p className="mt-0.5 text-[12.5px] text-ink-2">{p.note.replace(/\s*\(AI suggestion: check hours and fees locally\.\)$/, '')}</p>}
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={done}
                  icon={<Plus className="h-4 w-4" />}
                  onClick={() => {
                    setAdded((s) => new Set(s).add(p.id));
                    onAdd(dest.id, p);
                  }}
                >
                  {done ? 'Added' : 'Add'}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
