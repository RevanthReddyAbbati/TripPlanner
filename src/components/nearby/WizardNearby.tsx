import { useMemo } from 'react';
import { Compass, Plus, Route } from 'lucide-react';
import type { Destination, TripInput } from '../../types';
import { nearbyForInput } from '../../engine/nearby';
import { findDestination } from '../../data/destinations';
import { fmtDuration } from '../../lib/time';
import { inr } from '../../lib/format';
import { Badge } from '../ui/Fields';
import { Button } from '../ui/Button';

/** Compact "worth adding nearby" ideas for the new-trip review step. */
export function WizardNearby({ input, onAddDestination }: { input: TripInput; onAddDestination: (d: Destination, extraDays: number) => void }) {
  const ideas = useMemo(() => {
    if (!input.destinations.length) return [];
    const all = nearbyForInput(input);
    // Prefer one or two route additions, then fill with the best day trips.
    const dests = all.filter((s) => s.kind === 'add-destination').slice(0, 2);
    const trips = all.filter((s) => s.kind === 'day-trip').slice(0, 3 - dests.length);
    return [...dests, ...trips];
  }, [input]);

  if (!ideas.length) return null;

  return (
    <section className="rounded-xl border border-line bg-sunken/40 p-4">
      <h3 className="flex items-center gap-2 text-[14px] font-semibold">
        <Compass className="h-4 w-4 text-brand" /> Worth adding nearby
      </h3>
      <p className="mt-0.5 text-[12.5px] text-muted">More day trips and ideas appear on your trip's Overview once the plan is built.</p>
      <ul className="mt-3 space-y-2.5">
        {ideas.map((s) => (
          <li key={s.id} className="flex flex-wrap items-start gap-3 rounded-lg bg-surface px-3 py-2.5 shadow-card">
            <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md bg-brand-soft text-brand">
              {s.kind === 'add-destination' ? <Route className="h-3.5 w-3.5" /> : <Compass className="h-3.5 w-3.5" />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[13.5px] font-medium">{s.title}</span>
                {s.inSeason === true && <Badge tone="ok">In season</Badge>}
                {s.inSeason === false && <Badge tone="warn">Off season</Badge>}
              </div>
              <div className="text-[12.5px] text-muted">
                {s.distanceKm} km from {s.near} · {fmtDuration(s.travelMin)} each way
                {s.kind === 'add-destination' && s.action.type === 'add-destination' ? ` · +${s.action.extraDays} day${s.action.extraDays > 1 ? 's' : ''}, about ${inr(s.extraCostPP)} more per person` : s.extraCostPP ? ` · about ${inr(s.extraCostPP)} per person` : ''}
              </div>
              <p className="mt-0.5 line-clamp-2 text-[12.5px] text-ink-2">{s.why}</p>
            </div>
            {s.action.type === 'add-destination' && (
              <Button
                size="xs"
                variant="secondary"
                icon={<Plus className="h-3.5 w-3.5" />}
                onClick={() => {
                  const d = findDestination((s.action as { destinationId: string }).destinationId);
                  if (d) onAddDestination(d, (s.action as { extraDays: number }).extraDays);
                }}
              >
                Add to route
              </Button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
