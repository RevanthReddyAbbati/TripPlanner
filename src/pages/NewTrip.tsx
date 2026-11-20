import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, Clock, MapPin, Plus, Sparkles, Trash2, Wand2 } from 'lucide-react';
import clsx from 'clsx';
import type { City, Destination, Interest, TripInput } from '../types';
import { DESTINATIONS, ORIGIN_CITIES, findDestination } from '../data/destinations';
import { useSettings } from '../store/settings';
import { useTrips } from '../store/trips';
import { generateTrip } from '../engine/planner';
import { computeBudget } from '../engine/budget';
import { discoverDestination } from '../services/geo';
import { Page, PageHeader } from '../components/layout/AppShell';
import { Button, IconButton } from '../components/ui/Button';
import { Chip, Field, OptionCards, Stepper } from '../components/ui/Fields';
import { BudgetMeter } from '../components/ui/BudgetMeter';
import { PlaceSearch } from '../components/PlaceSearch';
import { FOOD_OPTIONS, INTERESTS, LOCAL_OPTIONS, PACE_OPTIONS, STAY_OPTIONS, TRANSPORT_OPTIONS } from '../components/options';
import { Spinner } from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';
import { inr, plural } from '../lib/format';
import { fmtDate, fmtDuration, nextSaturday } from '../lib/time';
import { MODES } from '../engine/rates';
import { AiDescribeTrip, type DescribeResult } from '../components/ai/AiDescribeTrip';

const STEPS = ['Where', 'When and who', 'How you travel', 'Review'] as const;

export default function NewTrip() {
  const [params] = useSearchParams();
  const defaults = useSettings((s) => s.defaults);
  const create = useTrips((s) => s.create);
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState(0);
  const [sameReturn, setSameReturn] = useState(true);
  const [destFilter, setDestFilter] = useState('');
  const [discovering, setDiscovering] = useState(false);
  const [input, setInput] = useState<TripInput>(() => {
    const pre = params.get('dest');
    const d = pre ? findDestination(pre) : undefined;
    return {
      name: d ? `Trip to ${d.name}` : '',
      origin: defaults.origin ?? ORIGIN_CITIES[0],
      destinations: d ? [d] : [],
      startDate: nextSaturday(),
      days: 5,
      travelers: defaults.travelers,
      budgetPerPerson: defaults.budgetPerPerson,
      transport: defaults.transport,
      returnTransport: defaults.transport,
      localTransport: defaults.localTransport,
      stay: defaults.stay,
      food: defaults.food,
      pace: defaults.pace,
      interests: ['beaches', 'history', 'nature'],
      overnightTravel: defaults.overnightTravel,
    };
  });

  const set = <K extends keyof TripInput>(k: K, v: TripInput[K]) =>
    setInput((s) => {
      const next = { ...s, [k]: v };
      if (k === 'transport' && sameReturn) next.returnTransport = v as TripInput['transport'];
      return next;
    });

  // Landing page "Try the sample" link
  const sampleLoaded = useRef(false);
  useEffect(() => {
    if (sampleLoaded.current) return;
    sampleLoaded.current = true;
    if (params.get('sample') === 'goa') loadSample();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const preview = useMemo(() => {
    if (!input.destinations.length) return null;
    const trip = generateTrip({ ...input, name: input.name || 'Preview' });
    return { trip, budget: computeBudget(trip) };
  }, [input]);

  const loadSample = () => {
    const ids = ['north-goa', 'south-goa', 'gokarna'];
    const dests = ids.map((id) => findDestination(id)).filter(Boolean) as Destination[];
    setInput((s) => ({
      ...s,
      name: 'Goa and Gokarna with friends',
      origin: ORIGIN_CITIES.find((c) => c.name === 'Hyderabad') ?? ORIGIN_CITIES[0],
      destinations: dests,
      startDate: nextSaturday(),
      days: 6,
      travelers: 4,
      budgetPerPerson: 10000,
      transport: 'bus_ac',
      returnTransport: 'bus_nonac',
      localTransport: 'scooter',
      stay: 'budget',
      food: 'mixed',
      pace: 'balanced',
      interests: ['beaches', 'history', 'nightlife', 'nature'],
      overnightTravel: true,
    }));
    setSameReturn(false);
    toast('Sample trip loaded. Review each step or go straight to Review.');
  };

  const addDest = (d: Destination) => {
    if (input.destinations.some((x) => x.id === d.id)) return;
    setInput((s) => ({ ...s, destinations: [...s.destinations, d], name: s.name || `Trip to ${d.name}` }));
  };
  const applyDescription = ({ request: r, discovered, missed }: DescribeResult) => {
    const catalogDests = r.destinationIds.map((id) => findDestination(id)).filter(Boolean) as Destination[];
    const dests = [...catalogDests, ...discovered];
    const filled: string[] = [];
    {
      const s = input;
      const next: TripInput = { ...s };
      if (dests.length) {
        next.destinations = dests;
        filled.push(plural(dests.length, 'destination'));
      }
      if (r.origin) {
        next.origin = r.origin;
        filled.push(`from ${r.origin.name}`);
      }
      if (r.name) next.name = r.name;
      else if (dests.length && !s.name) next.name = `Trip to ${dests.map((d) => d.name).join(' and ')}`;
      if (r.startDate) {
        next.startDate = r.startDate;
        filled.push(`starting ${fmtDate(r.startDate)}`);
      }
      if (r.days) {
        next.days = r.days;
        filled.push(plural(r.days, 'day'));
      }
      if (r.travelers) {
        next.travelers = r.travelers;
        filled.push(plural(r.travelers, 'traveller'));
      }
      if (r.budgetPerPerson) {
        next.budgetPerPerson = r.budgetPerPerson;
        filled.push(`${inr(r.budgetPerPerson)} each`);
      }
      if (r.transport) next.transport = r.transport;
      if (r.returnTransport || r.transport) next.returnTransport = r.returnTransport ?? r.transport!;
      if (r.transport) filled.push(MODES[r.transport].label.toLowerCase());
      if (r.localTransport) next.localTransport = r.localTransport;
      if (r.stay) next.stay = r.stay;
      if (r.food) next.food = r.food;
      if (r.pace) next.pace = r.pace;
      if (r.interests?.length) next.interests = r.interests;
      setInput(next);
    }
    if (r.transport && r.returnTransport && r.returnTransport !== r.transport) setSameReturn(false);
    else if (r.transport) setSameReturn(true);
    const missText = missed.length ? ` Couldn't find ${missed.join(', ')} on the map.` : '';
    if (dests.length) {
      toast(`Filled in ${filled.join(', ')}. Review and create the plan.${missText}`);
      setStep(3);
    } else {
      toast(`No destinations recognised. Add them below.${missText}`, missed.length ? 'error' : 'ok');
    }
  };

  const moveDest = (i: number, dir: -1 | 1) =>
    setInput((s) => {
      const a = [...s.destinations];
      const j = i + dir;
      if (j < 0 || j >= a.length) return s;
      [a[i], a[j]] = [a[j], a[i]];
      return { ...s, destinations: a };
    });
  const removeDest = (id: string) => setInput((s) => ({ ...s, destinations: s.destinations.filter((d) => d.id !== id) }));

  const toggleInterest = (i: Interest) =>
    set('interests', input.interests.includes(i) ? input.interests.filter((x) => x !== i) : [...input.interests, i]);

  const errors = validate(input);
  const stepError = step === 0 ? errors.where : step === 1 ? errors.when : undefined;

  const submit = () => {
    if (errors.where || errors.when) {
      setStep(errors.where ? 0 : 1);
      return;
    }
    const id = create({ ...input, name: input.name.trim() || `Trip to ${input.destinations[0].name}` });
    toast('Trip planned. Edit any day, add places or adjust the budget.');
    navigate(`/app/trips/${id}`);
  };

  const catalog = DESTINATIONS.filter((d) => {
    const f = destFilter.trim().toLowerCase();
    return !f || d.name.toLowerCase().includes(f) || d.state.toLowerCase().includes(f) || d.tags.some((t) => t.includes(f));
  });

  return (
    <Page>
      <PageHeader
        crumbs={[{ label: 'Trips', to: '/app/trips' }, { label: 'New trip' }]}
        title="Plan a trip"
        actions={
          <Button variant="secondary" icon={<Wand2 className="h-4 w-4" />} onClick={loadSample}>
            Load sample: Goa and Gokarna
          </Button>
        }
      >
        Tell us where, when and how. The plan, map and budget build themselves, and you can change anything afterwards.
      </PageHeader>

      <ol className="mb-6 grid grid-cols-2 overflow-hidden rounded-xl border border-line bg-surface shadow-card sm:grid-cols-4" aria-label="Steps">
        {STEPS.map((s, i) => (
          <li key={s} className={clsx('border-line', i % 2 === 1 && 'border-l', i > 1 && 'border-t sm:border-t-0', i > 0 && 'sm:border-l')}>
            <button
              type="button"
              onClick={() => setStep(i)}
              aria-current={i === step ? 'step' : undefined}
              className={clsx(
                'relative flex w-full items-center gap-2.5 px-4 py-3 text-left text-[13.5px] transition-colors',
                i === step ? 'bg-brand-soft/50 text-ink' : 'text-muted hover:bg-sunken/60 hover:text-ink',
              )}
            >
              <span
                className={clsx(
                  'grid h-6 w-6 shrink-0 place-items-center rounded-full text-[12px] font-semibold',
                  i < step ? 'bg-ok text-white' : i === step ? 'bg-brand text-brand-ink' : 'border border-line-strong text-muted',
                )}
              >
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-[11.5px] text-muted">Step {i + 1}</span>
                <span className="block truncate font-medium">{s}</span>
              </span>
              {i === step && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-brand" />}
            </button>
          </li>
        ))}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="card min-w-0 p-5 sm:p-6">
          {step === 0 && (
            <div className="space-y-6">
              <AiDescribeTrip onApply={applyDescription} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Trip name" htmlFor="trip-name">
                  <input id="trip-name" className="input" placeholder="e.g. Goa with college friends" value={input.name} onChange={(e) => set('name', e.target.value)} />
                </Field>
                <Field label="Starting from" htmlFor="origin" hint="Pick a city, or search any town below.">
                  <select
                    id="origin"
                    className="input"
                    value={input.origin.name}
                    onChange={(e) => {
                      const c = ORIGIN_CITIES.find((x) => x.name === e.target.value);
                      if (c) set('origin', c);
                    }}
                  >
                    {!ORIGIN_CITIES.some((c) => c.name === input.origin.name) && <option value={input.origin.name}>{input.origin.name}</option>}
                    {ORIGIN_CITIES.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}, {c.state}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Starting from somewhere else?" htmlFor="origin-search">
                <PlaceSearch
                  id="origin-search"
                  countryCodes="in"
                  placeholder="Search your town"
                  onSelect={(r) => set('origin', { name: r.name, state: r.label.split(',').slice(-2, -1)[0]?.trim() ?? '', lat: r.lat, lon: r.lon } satisfies City)}
                />
              </Field>

              <div>
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <h2 className="text-[17px] font-semibold">Your route</h2>
                  <span className="text-[13px] text-muted">Visited in this order</span>
                </div>
                {input.destinations.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-[14px] text-muted">
                    Add one or more destinations from the list below, or search any town.
                  </p>
                ) : (
                  <ol className="divide-y divide-line rounded-lg border border-line">
                    <li className="flex items-center gap-3 px-3 py-2.5 text-[14px] text-muted">
                      <MapPin className="h-4 w-4" /> {input.origin.name} <span className="text-[12px]">(start and end)</span>
                    </li>
                    {input.destinations.map((d, i) => (
                      <li key={d.id} className="flex items-center gap-3 px-3 py-2.5">
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-[12px] font-semibold text-brand-ink">{i + 1}</span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{d.name}</div>
                          <div className="truncate text-[12.5px] text-muted">
                            {d.state} · {plural(d.places.length, 'place')}
                            {d.source === 'custom' && ' · from OpenStreetMap'}
                          </div>
                        </div>
                        <IconButton label="Move up" disabled={i === 0} onClick={() => moveDest(i, -1)}>
                          <ArrowUp className="h-4 w-4" />
                        </IconButton>
                        <IconButton label="Move down" disabled={i === input.destinations.length - 1} onClick={() => moveDest(i, 1)}>
                          <ArrowDown className="h-4 w-4" />
                        </IconButton>
                        <IconButton label={`Remove ${d.name}`} onClick={() => removeDest(d.id)}>
                          <Trash2 className="h-4 w-4" />
                        </IconButton>
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              <div>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-[17px] font-semibold">Add destinations</h2>
                  <input className="input max-w-[220px]" placeholder="Filter by name or state" value={destFilter} onChange={(e) => setDestFilter(e.target.value)} aria-label="Filter destinations" />
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {catalog.map((d) => {
                    const added = input.destinations.some((x) => x.id === d.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        disabled={added}
                        onClick={() => addDest(d)}
                        className={clsx(
                          'flex items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors',
                          added ? 'border-brand/40 bg-brand-soft' : 'border-line hover:bg-sunken',
                        )}
                      >
                        <span className={clsx('mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full', added ? 'bg-brand text-brand-ink' : 'bg-sunken text-muted')}>
                          {added ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-medium">{d.name}</span>
                          <span className="block truncate text-[12.5px] text-muted">
                            {d.state} · {d.summary}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4">
                  <Field label="Somewhere else?" htmlFor="dest-search" hint="We look up attractions near it on OpenStreetMap. You can add more on the map later.">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <PlaceSearch
                          id="dest-search"
                          placeholder="Search any town or region"
                          onSelect={async (r) => {
                            setDiscovering(true);
                            try {
                              const d = await discoverDestination(r);
                              addDest(d);
                              toast(d.places.length ? `Added ${d.name} with ${d.places.length} places.` : `Added ${d.name}. Add places from the map later.`);
                            } finally {
                              setDiscovering(false);
                            }
                          }}
                        />
                      </div>
                      {discovering && <Spinner />}
                    </div>
                  </Field>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Start date" htmlFor="start" hint={`Day 1 is ${fmtDate(input.startDate)}.`}>
                <input id="start" type="date" className="input" value={input.startDate} onChange={(e) => e.target.value && set('startDate', e.target.value)} />
              </Field>
              <Field label="Number of days" htmlFor="days" hint="Including travel days.">
                <Stepper id="days" value={input.days} min={1} max={30} onChange={(n) => set('days', n)} suffix="days" />
              </Field>
              <Field label="Travellers" htmlFor="travellers" hint="Rooms, vehicles and shared costs are split across the group.">
                <Stepper id="travellers" value={input.travelers} min={1} max={20} onChange={(n) => set('travelers', n)} suffix="people" />
              </Field>
              <Field label="Budget per person (₹)" htmlFor="budget" hint="Everything included: travel, stay, food, entries.">
                <input
                  id="budget"
                  type="number"
                  inputMode="numeric"
                  min={1000}
                  step={500}
                  className="input tabular"
                  value={input.budgetPerPerson}
                  onChange={(e) => set('budgetPerPerson', Math.max(0, Number(e.target.value) || 0))}
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[8000, 10000, 15000, 25000, 50000].map((b) => (
                    <Chip key={b} on={input.budgetPerPerson === b} onClick={() => set('budgetPerPerson', b)}>
                      {inr(b)}
                    </Chip>
                  ))}
                </div>
              </Field>
              <div className="sm:col-span-2">
                <span className="label">What do you enjoy?</span>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map((i) => (
                    <Chip key={i.value} on={input.interests.includes(i.value)} onClick={() => toggleInterest(i.value)}>
                      {i.label}
                    </Chip>
                  ))}
                </div>
                <p className="hint">Places that match get priority in the plan.</p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <Field label={`Getting to ${input.destinations[0]?.name ?? 'your destination'}`}>
                <OptionCards name="transport" value={input.transport} options={TRANSPORT_OPTIONS} onChange={(v) => set('transport', v)} />
              </Field>
              <div>
                <label className="flex items-center gap-2 text-[14px]">
                  <input
                    type="checkbox"
                    id="same-return"
                    className="h-4 w-4 accent-[rgb(var(--brand))]"
                    checked={sameReturn}
                    onChange={(e) => {
                      setSameReturn(e.target.checked);
                      if (e.target.checked) set('returnTransport', input.transport);
                    }}
                  />
                  Come back the same way
                </label>
                {!sameReturn && (
                  <div className="mt-3">
                    <OptionCards name="return" value={input.returnTransport} options={TRANSPORT_OPTIONS} onChange={(v) => set('returnTransport', v)} />
                  </div>
                )}
              </div>
              <label className="flex items-start gap-3 rounded-lg border border-line p-3">
                <input type="checkbox" id="overnight" className="mt-1 h-4 w-4 accent-[rgb(var(--brand))]" checked={input.overnightTravel} onChange={(e) => set('overnightTravel', e.target.checked)} />
                <span>
                  <span className="block font-medium">Travel overnight on long journeys</span>
                  <span className="block text-[13px] text-muted">Sleeper buses and trains over 6 hours leave in the evening, so you save a hotel night and arrive with a full day ahead.</span>
                </span>
              </label>
              <Field label="Getting around at the destination">
                <OptionCards name="local" value={input.localTransport} options={LOCAL_OPTIONS} onChange={(v) => set('localTransport', v)} columns={2} />
              </Field>
              <Field label="Where you stay">
                <OptionCards name="stay" value={input.stay} options={STAY_OPTIONS} onChange={(v) => set('stay', v)} columns={2} />
              </Field>
              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="Food">
                  <OptionCards name="food" value={input.food} options={FOOD_OPTIONS} onChange={(v) => set('food', v)} columns={2} />
                </Field>
                <Field label="Pace">
                  <OptionCards name="pace" value={input.pace} options={PACE_OPTIONS} onChange={(v) => set('pace', v)} columns={2} />
                </Field>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-[20px] font-semibold">{input.name || `Trip to ${input.destinations[0]?.name ?? '...'}`}</h2>
              <dl className="grid gap-x-6 gap-y-3 text-[14px] sm:grid-cols-2">
                <Row k="Route" v={[input.origin.name, ...input.destinations.map((d) => d.name), input.origin.name].join(' → ')} />
                <Row k="Dates" v={`${fmtDate(input.startDate)}, ${plural(input.days, 'day')}`} />
                <Row k="Group" v={`${plural(input.travelers, 'person', 'people')}, budget ${inr(input.budgetPerPerson)} each`} />
                <Row k="Getting there" v={`${MODES[input.transport].label}, back by ${MODES[input.returnTransport].label.toLowerCase()}`} />
                <Row k="Getting around" v={LOCAL_OPTIONS.find((o) => o.value === input.localTransport)?.label ?? ''} />
                <Row k="Stay and food" v={`${STAY_OPTIONS.find((o) => o.value === input.stay)?.label}, ${FOOD_OPTIONS.find((o) => o.value === input.food)?.label.toLowerCase()}`} />
              </dl>
              {(errors.where || errors.when) && <p className="rounded-lg bg-bad/10 px-3 py-2 text-[14px] text-bad">{errors.where || errors.when}</p>}
              {preview?.trip.warnings.map((w) => (
                <p key={w} className="rounded-lg bg-warn/10 px-3 py-2 text-[13.5px] text-warn">
                  {w}
                </p>
              ))}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-5">
            <Button variant="ghost" icon={<ArrowLeft className="h-4 w-4" />} disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
            {stepError && <span className="hidden text-[13px] text-bad sm:block">{stepError}</span>}
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!!stepError}>
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={submit} icon={<Sparkles className="h-4 w-4" />} disabled={!!(errors.where || errors.when)}>
                Create plan
              </Button>
            )}
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-[4.5rem] lg:self-start">
          <div className="card p-5">
            <div className="mb-2 text-[12.5px] font-medium text-muted">Live estimate</div>
            {preview ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-[28px] font-semibold tracking-tight tabular">{inr(preview.budget.perPerson)}</span>
                  <span className="text-[13px] text-muted">per person</span>
                </div>
                <BudgetMeter value={preview.budget.perPerson} cap={input.budgetPerPerson} />
                <ul className="mt-4 space-y-2 text-[13.5px]">
                  {preview.trip.legs.map((l) => (
                    <li key={l.id} className="flex items-start gap-2">
                      <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" />
                      <span className="min-w-0 flex-1">
                        {l.from.name} → {l.to.name}
                        <span className="block text-[12px] text-muted">
                          {fmtDuration(l.durationMin)}, {l.distanceKm} km{l.overnight ? ', overnight' : ''}
                        </span>
                      </span>
                      <span className="text-[12.5px] font-medium tabular">{inr(l.cost)}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-[13.5px] text-muted">Add a destination to see travel times and the cost per person.</p>
            )}
          </div>
          <p className="px-1 text-[12px] text-muted">Prices are typical figures for India. Check fares and room rates when you book.</p>
        </aside>
      </div>
    </Page>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[12.5px] text-muted">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}

function validate(i: TripInput): { where?: string; when?: string } {
  const out: { where?: string; when?: string } = {};
  if (!i.destinations.length) out.where = 'Add at least one destination.';
  if (i.days < 1 || i.days > 30) out.when = 'Pick between 1 and 30 days.';
  else if (i.travelers < 1) out.when = 'Add at least one traveller.';
  else if (i.budgetPerPerson < 1000) out.when = 'Set a budget of at least ₹1,000 per person.';
  return out;
}
