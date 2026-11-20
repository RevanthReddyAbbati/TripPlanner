import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Download, Sparkles, Trash2, Upload } from 'lucide-react';
import { AISettings } from '../components/ai/AISettings';
import type { Trip } from '../types';
import { useSettings, type Theme } from '../store/settings';
import { useTrips } from '../store/trips';
import { ORIGIN_CITIES } from '../data/destinations';
import { Page, PageHeader } from '../components/layout/AppShell';
import { Field, OptionCards, Segmented, Stepper } from '../components/ui/Fields';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { FOOD_OPTIONS, LOCAL_OPTIONS, PACE_OPTIONS, STAY_OPTIONS, TRANSPORT_OPTIONS } from '../components/options';
import { downloadFile } from '../lib/share';

export default function Settings() {
  const s = useSettings();
  const trips = useTrips();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  // Deep link from "Set up AI" buttons: /app/settings#ai (hash routing puts it after the route).
  useEffect(() => {
    if (window.location.hash.endsWith('#ai')) setTimeout(() => document.getElementById('ai')?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, []);

  const backup = () => {
    const data = { app: 'itinera', exportedAt: new Date().toISOString(), trips: trips.order.map((id) => trips.trips[id]) };
    downloadFile(`itinera-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2), 'application/json');
  };

  const restore = async (f: File) => {
    try {
      const data = JSON.parse(await f.text()) as { trips?: Trip[] };
      if (!Array.isArray(data.trips)) throw new Error();
      data.trips.forEach((t) => trips.importTrip(t));
      toast(`Restored ${data.trips.length} trip${data.trips.length === 1 ? '' : 's'}.`);
    } catch {
      toast('That file is not an Itinera backup.', 'error');
    }
  };

  return (
    <Page>
      <PageHeader title="Settings" crumbs={[{ label: 'Workspace' }, { label: 'Settings' }]}>
        Profile, appearance, defaults for new trips, and your data.
      </PageHeader>
      <div className="space-y-6">
        <Section title="Profile" desc="Shown in the sidebar and on shared plans.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Your name" htmlFor="set-name">
              <input id="set-name" className="input" defaultValue={s.displayName} onBlur={(e) => s.setProfile({ displayName: e.target.value.trim() })} />
            </Field>
            <Field label="Workspace name" htmlFor="set-ws">
              <input id="set-ws" className="input" defaultValue={s.workspaceName} onBlur={(e) => s.setProfile({ workspaceName: e.target.value.trim() || 'My workspace' })} />
            </Field>
          </div>
        </Section>

        <Section title="Appearance">
          <Segmented<Theme>
            label="Theme"
            value={s.theme}
            onChange={s.setTheme}
            options={[
              { value: 'system', label: 'Match system' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
          />
        </Section>

        <Section title="Defaults for new trips" desc="Pre-filled every time you plan a trip.">
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Home city" htmlFor="set-origin">
              <select
                id="set-origin"
                className="input"
                value={s.defaults.origin?.name ?? ORIGIN_CITIES[0].name}
                onChange={(e) => s.setDefaults({ origin: ORIGIN_CITIES.find((c) => c.name === e.target.value) })}
              >
                {ORIGIN_CITIES.map((c) => (
                  <option key={c.name}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Travellers" htmlFor="set-trav">
              <Stepper id="set-trav" value={s.defaults.travelers} min={1} max={20} onChange={(n) => s.setDefaults({ travelers: n })} />
            </Field>
            <Field label="Budget per person (₹)" htmlFor="set-budget">
              <input id="set-budget" type="number" step={500} min={1000} className="input tabular" defaultValue={s.defaults.budgetPerPerson} onBlur={(e) => s.setDefaults({ budgetPerPerson: Math.max(1000, Number(e.target.value) || 10000) })} />
            </Field>
          </div>
          <div className="mt-5 space-y-5">
            <Field label="Preferred transport">
              <OptionCards name="set-transport" value={s.defaults.transport} options={TRANSPORT_OPTIONS} onChange={(v) => s.setDefaults({ transport: v })} />
            </Field>
            <div className="grid gap-5 lg:grid-cols-2">
              <Field label="Getting around">
                <OptionCards name="set-local" value={s.defaults.localTransport} options={LOCAL_OPTIONS} onChange={(v) => s.setDefaults({ localTransport: v })} columns={2} />
              </Field>
              <Field label="Stay">
                <OptionCards name="set-stay" value={s.defaults.stay} options={STAY_OPTIONS} onChange={(v) => s.setDefaults({ stay: v })} columns={2} />
              </Field>
              <Field label="Food">
                <OptionCards name="set-food" value={s.defaults.food} options={FOOD_OPTIONS} onChange={(v) => s.setDefaults({ food: v })} columns={2} />
              </Field>
              <Field label="Pace">
                <OptionCards name="set-pace" value={s.defaults.pace} options={PACE_OPTIONS} onChange={(v) => s.setDefaults({ pace: v })} columns={2} />
              </Field>
            </div>
          </div>
        </Section>

        <Section
          title="AI assistant"
          desc="Gemini powers the trip assistant, plan changes in plain words, place ideas, receipt scanning and describe-your-trip."
          badge
          id="ai"
        >
          <AISettings />
        </Section>

        <Section title="Your data" desc="Trips are stored in this browser. Back them up before clearing browser data or switching devices.">
          <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={(e) => e.target.files?.[0] && restore(e.target.files[0])} />
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={backup} disabled={!trips.order.length}>
              Download backup
            </Button>
            <Button variant="secondary" icon={<Upload className="h-4 w-4" />} onClick={() => fileRef.current?.click()}>
              Restore from backup
            </Button>
            <Button variant="danger" icon={<Trash2 className="h-4 w-4" />} onClick={() => setConfirmClear(true)} disabled={!trips.order.length}>
              Delete all trips
            </Button>
          </div>
        </Section>
      </div>

      <Modal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Delete all trips?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmClear(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                trips.clearAll();
                setConfirmClear(false);
                toast('All trips deleted.');
              }}
            >
              Delete {trips.order.length} trips
            </Button>
          </>
        }
      >
        <p className="text-[14px]">This removes every trip from this browser and can't be undone. Download a backup first if you might need them.</p>
      </Modal>
    </Page>
  );
}

function Section({ title, desc, children, badge, id }: { title: string; desc?: string; children: ReactNode; badge?: boolean; id?: string }) {
  return (
    <section id={id} className="card scroll-mt-20 p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="flex items-center gap-2 text-[17px] font-semibold">
          {title}
          {badge && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[11.5px] font-semibold text-accent">
              <Sparkles className="h-3 w-3" /> Gemini
            </span>
          )}
        </h2>
        {desc && <p className="mt-0.5 max-w-[65ch] text-[13.5px] text-muted">{desc}</p>}
      </div>
      {children}
    </section>
  );
}
