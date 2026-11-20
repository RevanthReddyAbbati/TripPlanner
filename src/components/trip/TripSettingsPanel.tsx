import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import type { Trip, TripInput } from '../../types';
import { Field, OptionCards, Stepper, Chip } from '../ui/Fields';
import { Button } from '../ui/Button';
import { Avatar, Card } from '../ui/Kit';
import { FOOD_OPTIONS, INTERESTS, LOCAL_OPTIONS, PACE_OPTIONS, STAY_OPTIONS, TRANSPORT_OPTIONS } from '../options';

/** Travellers plus the trip's inputs, with a rebuild of the plan. */
export function TripSettingsPanel({ trip, onRebuild, onRenameTraveler }: { trip: Trip; onRebuild: (patch: Partial<TripInput>) => void; onRenameTraveler: (id: string, name: string) => void }) {
  const input = trip.input;
  const [draft, setDraft] = useState<TripInput>(input);
  const set = <K extends keyof TripInput>(k: K, v: TripInput[K]) => setDraft((s) => ({ ...s, [k]: v }));
  const dirty = JSON.stringify(draft) !== JSON.stringify(input);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <Card
        title="Plan settings"
        subtitle="Change dates, group size or travel style, then rebuild. Manual itinerary edits are replaced; expenses, bookings, notes and checklist ticks stay."
        actions={
          <Button icon={<RefreshCw className="h-4 w-4" />} disabled={!dirty} onClick={() => onRebuild(draft)}>
            Rebuild plan
          </Button>
        }
        bodyClass="space-y-6 p-5"
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Start date" htmlFor="s-start">
            <input id="s-start" type="date" className="input" value={draft.startDate} onChange={(e) => e.target.value && set('startDate', e.target.value)} />
          </Field>
          <Field label="Days" htmlFor="s-days">
            <Stepper id="s-days" value={draft.days} min={1} max={30} onChange={(n) => set('days', n)} />
          </Field>
          <Field label="Travellers" htmlFor="s-trav">
            <Stepper id="s-trav" value={draft.travelers} min={1} max={20} onChange={(n) => set('travelers', n)} />
          </Field>
          <Field label="Budget per person (₹)" htmlFor="s-budget">
            <input id="s-budget" type="number" step={500} min={1000} className="input tabular" value={draft.budgetPerPerson} onChange={(e) => set('budgetPerPerson', Number(e.target.value) || 0)} />
          </Field>
        </div>
        <Field label="Getting there">
          <OptionCards name="s-transport" value={draft.transport} options={TRANSPORT_OPTIONS} onChange={(v) => set('transport', v)} />
        </Field>
        <Field label="Coming back">
          <OptionCards name="s-return" value={draft.returnTransport} options={TRANSPORT_OPTIONS} onChange={(v) => set('returnTransport', v)} />
        </Field>
        <label className="flex items-center gap-2 text-[13.5px]">
          <input type="checkbox" id="s-overnight" className="h-4 w-4 accent-[rgb(var(--brand))]" checked={draft.overnightTravel} onChange={(e) => set('overnightTravel', e.target.checked)} />
          Travel overnight on journeys over 6 hours
        </label>
        <div className="grid gap-5 lg:grid-cols-2">
          <Field label="Getting around">
            <OptionCards name="s-local" value={draft.localTransport} options={LOCAL_OPTIONS} onChange={(v) => set('localTransport', v)} columns={2} />
          </Field>
          <Field label="Stay">
            <OptionCards name="s-stay" value={draft.stay} options={STAY_OPTIONS} onChange={(v) => set('stay', v)} columns={2} />
          </Field>
          <Field label="Food">
            <OptionCards name="s-food" value={draft.food} options={FOOD_OPTIONS} onChange={(v) => set('food', v)} columns={2} />
          </Field>
          <Field label="Pace">
            <OptionCards name="s-pace" value={draft.pace} options={PACE_OPTIONS} onChange={(v) => set('pace', v)} columns={2} />
          </Field>
        </div>
        <div>
          <span className="label">Interests</span>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((i) => (
              <Chip
                key={i.value}
                on={draft.interests.includes(i.value)}
                onClick={() => set('interests', draft.interests.includes(i.value) ? draft.interests.filter((x) => x !== i.value) : [...draft.interests, i.value])}
              >
                {i.label}
              </Chip>
            ))}
          </div>
        </div>
      </Card>

      <Card title="Travellers" subtitle="Names appear on expenses and in settle-up." bodyClass="divide-y divide-line">
        {trip.travelers.map((t, i) => (
          <div key={t.id} className="flex items-center gap-3 px-5 py-3">
            <Avatar person={t} size={30} />
            <label className="sr-only" htmlFor={`trav-${t.id}`}>
              Traveller {i + 1} name
            </label>
            <input
              id={`trav-${t.id}`}
              className="input"
              defaultValue={t.name}
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v && v !== t.name) onRenameTraveler(t.id, v);
              }}
            />
          </div>
        ))}
        <p className="px-5 py-3 text-[12.5px] text-muted">To add or remove people, change Travellers in plan settings and rebuild. People who already have expenses are kept.</p>
      </Card>
    </div>
  );
}
