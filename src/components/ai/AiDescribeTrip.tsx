import { useEffect, useRef, useState } from 'react';
import { Wand2 } from 'lucide-react';
import type { Destination } from '../../types';
import { parseTripRequest, type TripRequest } from '../../services/ai/provider';
import { AIError } from '../../services/ai/gemini';
import { discoverDestination, searchPlaces } from '../../services/geo';
import { DESTINATIONS, ORIGIN_CITIES } from '../../data/destinations';
import { useAIReady } from '../../store/ai';
import { AIBadge, AIConnectHint } from './AIConnectHint';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

export interface DescribeResult {
  request: TripRequest;
  /** Destinations found on OpenStreetMap for places outside the catalog. */
  discovered: Destination[];
  /** Places that could not be found. */
  missed: string[];
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** "Describe your trip": Gemini turns a sentence into wizard fields. */
export function AiDescribeTrip({ onApply }: { onApply: (r: DescribeResult) => void }) {
  const ready = useAIReady();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const ctrl = useRef<AbortController | null>(null);

  useEffect(() => () => ctrl.current?.abort(), []);

  const run = async () => {
    if (!text.trim()) return;
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    setBusy(true);
    setError('');
    setProgress('Reading your description…');
    try {
      const request = await parseTripRequest(text, DESTINATIONS, ORIGIN_CITIES, c.signal);
      const discovered: Destination[] = [];
      const missed: string[] = [];
      for (let i = 0; i < request.otherPlaces.length; i++) {
        if (c.signal.aborted) return;
        const name = request.otherPlaces[i];
        setProgress(`Looking up ${name} on the map (${i + 1} of ${request.otherPlaces.length})…`);
        if (i > 0) await wait(1100); // Nominatim allows about one request per second
        try {
          const [hit] = await searchPlaces(name, { countryCodes: 'in', signal: c.signal });
          if (hit) discovered.push(await discoverDestination(hit, c.signal));
          else missed.push(name);
        } catch (e) {
          if ((e as Error).name === 'AbortError') return;
          missed.push(name);
        }
      }
      if (c.signal.aborted) return;
      onApply({ request, discovered, missed });
      setProgress('');
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      setError(e instanceof AIError ? e.message : 'Could not understand that. Try rephrasing, or fill in the steps below.');
      setProgress('');
    } finally {
      if (ctrl.current === c) setBusy(false);
    }
  };

  return (
    <section className="rounded-xl border border-brand/25 bg-brand-soft/40 p-4 sm:p-5">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h2 className="text-[15px] font-semibold">Describe your trip</h2>
        <AIBadge />
      </div>
      {!ready ? (
        <AIConnectHint compact what="describe-your-trip" />
      ) : (
        <>
          <p className="mb-3 text-[13px] text-muted">Write it the way you'd tell a friend. Gemini fills in the steps below, and you can change anything.</p>
          <label htmlFor="ai-describe" className="sr-only">
            Describe your trip
          </label>
          <textarea
            id="ai-describe"
            className="input min-h-[84px] bg-surface"
            placeholder="6 days in Goa and Gokarna for 4 friends from Hyderabad, starting this Saturday, ₹10,000 each, sleeper bus, love beaches and forts"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                if (!busy) run();
              }
            }}
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button icon={<Wand2 className="h-4 w-4" />} onClick={run} disabled={busy || !text.trim()}>
              {busy ? 'Working…' : 'Fill in for me'}
            </Button>
            {busy && (
              <>
                <span className="inline-flex items-center gap-2 text-[13px] text-ink-2">
                  <Spinner className="h-4 w-4" /> {progress}
                </span>
                <Button variant="ghost" size="sm" onClick={() => { ctrl.current?.abort(); setBusy(false); setProgress(''); }}>
                  Cancel
                </Button>
              </>
            )}
          </div>
          {error && <p className="mt-3 rounded-lg bg-bad-soft px-3 py-2 text-[13px] font-medium text-bad">{error}</p>}
        </>
      )}
    </section>
  );
}
