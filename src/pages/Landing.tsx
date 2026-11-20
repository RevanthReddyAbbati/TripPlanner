import {
  ArrowRight, BarChart3, BusFront, CalendarClock, Check, CloudSun, Command, Map, ReceiptIndianRupee, Share2, Sparkles, Ticket, Users, Wallet,
} from 'lucide-react';
import { Logo } from '../components/layout/Logo';
import { ThemeToggle } from '../components/layout/ThemeToggle';
import { ButtonLink } from '../components/ui/Button';
import { BRAND } from '../config';
import { CATEGORIES } from '../engine/expenses';
import { Donut } from '../components/charts/Charts';

const FEATURES = [
  { icon: CalendarClock, title: 'Timed day-by-day plans', body: 'Opening hours, sunset spots, meals and travel time between stops are worked into every day, automatically.' },
  { icon: Map, title: 'Live maps and routes', body: 'OpenStreetMap with real road routes per day, place search, drop-a-pin and Google Maps links on every stop.' },
  { icon: BusFront, title: 'Every way to travel', body: 'Sleeper buses, trains, flights, your own car or bike. Overnight journeys save a hotel night.' },
  { icon: ReceiptIndianRupee, title: 'Expense tracking', body: 'Log spends in seconds during the trip. See what is spent, what is left and your daily allowance.' },
  { icon: Users, title: 'Split and settle up', body: 'Track who paid and who shares. Itinera works out the fewest transfers to settle the group.' },
  { icon: Ticket, title: 'Bookings in one place', body: 'Tickets and stays with PNRs and confirmation numbers, suggested straight from your plan.' },
  { icon: Wallet, title: 'Budget against a cap', body: 'Planned cost per person, category by category, with one-click ways to save when you go over.' },
  { icon: CloudSun, title: 'Weather on your dates', body: 'Forecasts for each destination on the days you are there, as soon as they are available.' },
  { icon: BarChart3, title: 'Reports', body: 'Spend by category, by traveller, by month and across trips. Export everything to CSV.' },
];

const demo = [
  { key: 'transport', value: 6120 },
  { key: 'stay', value: 6840 },
  { key: 'food', value: 9480 },
  { key: 'local', value: 2600 },
  { key: 'activities', value: 1900 },
  { key: 'shopping', value: 1250 },
];

export default function Landing() {
  const total = demo.reduce((a, d) => a + d.value, 0);
  return (
    <div className="min-h-full bg-surface">
      <header className="sticky z-[1000] border-b border-line bg-surface/85 backdrop-blur" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-1 sm:gap-2">
            <a href="#features" className="hidden rounded-lg px-3 py-1.5 text-[13.5px] text-ink-2 hover:bg-sunken sm:block">
              Features
            </a>
            <a href="#how" className="hidden rounded-lg px-3 py-1.5 text-[13.5px] text-ink-2 hover:bg-sunken sm:block">
              How it works
            </a>
            <a href="#roadmap" className="hidden rounded-lg px-3 py-1.5 text-[13.5px] text-ink-2 hover:bg-sunken md:block">
              Roadmap
            </a>
            <ThemeToggle />
            <ButtonLink to="/app/home" size="sm">
              Open app
            </ButtonLink>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-line bg-bg">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{ backgroundImage: 'radial-gradient(rgb(var(--line-strong)) 1px, transparent 1px)', backgroundSize: '22px 22px', maskImage: 'linear-gradient(to bottom, black, transparent 85%)' }}
          aria-hidden="true"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:py-24">
          <div>
            <a href="#roadmap" className="mb-5 inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface px-3 py-1 text-[12.5px] text-ink-2 shadow-card hover:bg-sunken">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> New: AI trip assistant powered by Gemini
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
            <h1 className="text-[40px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[54px]">
              Plan the trip. <br className="hidden sm:block" />
              Track every rupee.
            </h1>
            <p className="mt-5 max-w-[50ch] text-[16.5px] leading-relaxed text-muted">
              {BRAND.name} turns your destinations, dates, transport and budget into a timed itinerary with live maps, then tracks what the group actually spends, who owes whom, and what is left.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink to="/app/new" size="lg">
                Plan a trip <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink to="/app/new?sample=goa" size="lg" variant="secondary">
                Try the Goa sample
              </ButtonLink>
            </div>
            <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-muted">
              {['No sign-up', 'Works offline after load', 'Free during beta'].map((x) => (
                <li key={x} className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-ok" /> {x}
                </li>
              ))}
            </ul>
          </div>

          {/* Product preview built from the real UI pieces */}
          <div className="relative">
            <div className="overflow-hidden rounded-2xl border border-line-strong bg-surface shadow-pop">
              <div className="flex items-center gap-2 border-b border-line bg-sunken/70 px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                <span className="ml-3 truncate text-[12px] text-muted">Goa and Gokarna with friends · Expenses</span>
              </div>
              <div className="grid grid-cols-3 gap-px border-b border-line bg-line">
                {[
                  ['Spent so far', '₹28,190', '70% of ₹40,000 cap', 'text-ink'],
                  ['Remaining', '₹11,810', '₹5,905 a day', 'text-ok'],
                  ['Per person', '₹7,048', 'of ₹10,000 each', 'text-ink'],
                ].map(([l, v, s, c]) => (
                  <div key={l} className="bg-surface px-4 py-3">
                    <div className="text-[11.5px] text-muted">{l}</div>
                    <div className={`text-[18px] font-semibold tabular ${c}`}>{v}</div>
                    <div className="truncate text-[11px] text-muted">{s}</div>
                  </div>
                ))}
              </div>
              <div className="grid gap-5 p-5 sm:grid-cols-[auto_1fr]">
                <Donut
                  size={132}
                  thickness={18}
                  slices={demo.map((d) => {
                    const c = CATEGORIES.find((x) => x.key === d.key)!;
                    return { key: d.key, label: c.label, value: d.value, color: c.color };
                  })}
                  center={
                    <div>
                      <div className="text-[15px] font-semibold tabular">₹28.2k</div>
                      <div className="text-[10.5px] text-muted">spent</div>
                    </div>
                  }
                />
                <ul className="min-w-0 space-y-1.5 self-center text-[12.5px]">
                  {demo.slice(0, 5).map((d) => {
                    const c = CATEGORIES.find((x) => x.key === d.key)!;
                    return (
                      <li key={d.key} className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-sm" style={{ background: c.color }} />
                        <span className="flex-1 truncate text-ink-2">{c.label}</span>
                        <span className="tabular">₹{d.value.toLocaleString('en-IN')}</span>
                        <span className="w-8 text-right text-muted tabular">{Math.round((d.value / total) * 100)}%</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className="border-t border-line">
                {[
                  ['Dinner at Vagator', 'Food · Paid by Rahul · split 4 ways', '₹2,480'],
                  ['Scooters, 2 days', 'Getting around · Paid by You', '₹1,600'],
                  ['Om Beach boat', 'Activities · Paid by Arjun', '₹1,400'],
                ].map(([t, s, a]) => (
                  <div key={t} className="flex items-center gap-3 border-b border-line px-5 py-2.5 last:border-0">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium">{t}</div>
                      <div className="truncate text-[11.5px] text-muted">{s}</div>
                    </div>
                    <span className="text-[13px] font-semibold tabular">{a}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-5 -left-5 hidden rounded-xl border border-line bg-surface px-4 py-3 shadow-pop sm:block">
              <div className="text-[11.5px] text-muted">Settle up</div>
              <div className="text-[13px] font-medium">
                Arjun pays Rahul <span className="tabular font-semibold">₹1,240</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <div className="text-[13px] font-semibold text-brand">Everything in one workspace</div>
          <h2 className="mt-2 text-[32px] font-semibold leading-tight tracking-tight">From the first idea to the last settle-up</h2>
          <p className="mt-3 text-[15.5px] text-muted">Planning, booking, spending and splitting usually live in five different apps. Here they share one plan, so every number stays in sync.</p>
        </div>
        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-surface p-6">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-soft text-brand">
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <h3 className="mt-4 text-[15.5px] font-semibold">{title}</h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="border-y border-line bg-bg">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="text-[32px] font-semibold tracking-tight">How it works</h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-4">
            {[
              ['Plan', 'Pick where you start, destinations in order, dates, group size and budget per person.'],
              ['Shape', 'Choose transport, stays and pace. Edit the timed plan on the map and add places.'],
              ['Book', 'Turn suggested journeys and stays into bookings with PNRs and confirmation numbers.'],
              ['Spend and settle', 'Log expenses on the go, watch the remaining budget, and settle up at the end.'],
            ].map(([t, b], i) => (
              <li key={t} className="relative">
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-brand text-[13px] font-semibold text-brand-ink">{i + 1}</span>
                  <span className="hidden h-px flex-1 bg-line-strong md:block" />
                </div>
                <h3 className="mt-4 text-[16px] font-semibold">{t}</h3>
                <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{b}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex flex-wrap items-center gap-2 text-[13px] text-muted">
            <Command className="h-4 w-4" /> Power users: press <span className="kbd">Ctrl</span> <span className="kbd">K</span> anywhere in the app to jump to a trip or log an expense.
          </div>
        </div>
      </section>

      <section id="roadmap" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-line bg-surface p-7 shadow-card">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-ok-soft px-2.5 py-0.5 text-[12px] font-semibold text-ok">
              <span className="h-1.5 w-1.5 rounded-full bg-ok" /> Available now
            </div>
            <h3 className="mt-3 text-[20px] font-semibold">Planner and money tracker</h3>
            <ul className="mt-5 space-y-2.5 text-[14px]">
              {['Itinerary engine with real timings', 'Live maps, routes and place search', 'Expenses, splits and settle-up', 'Bookings, checklists, weather and reports', 'Share links, calendar, CSV and JSON export'].map((x) => (
                <li key={x} className="flex gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-ok" /> {x}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-accent/30 bg-surface p-7 shadow-card">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-warn-soft px-2.5 py-0.5 text-[12px] font-semibold text-accent">
              <Sparkles className="h-3.5 w-3.5" /> New · Powered by Gemini
            </div>
            <h3 className="mt-3 text-[20px] font-semibold">AI trip assistant</h3>
            <ul className="mt-5 space-y-2.5 text-[14px]">
              {['Ask anything about your trip, budget or who owes whom', 'Change the plan in plain words, then preview and apply', 'Place ideas that suit your group', 'Scan a bill or UPI screenshot into an expense', 'Describe a trip in one sentence and get the form filled'].map((x) => (
                <li key={x} className="flex gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" /> {x}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-[12.5px] text-muted">Next: accounts and sync across devices.</p>
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-bg">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-16 sm:px-6 md:flex-row md:items-center">
          <div>
            <h2 className="text-[26px] font-semibold tracking-tight">Your next trip, fully under control</h2>
            <p className="mt-1.5 text-muted">Plan it in minutes. Share it with the group. Keep every rupee accounted for.</p>
          </div>
          <div className="flex gap-3">
            <ButtonLink to="/app/new" size="lg">
              Plan a trip <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink to="/app/home" size="lg" variant="secondary">
              <Share2 className="h-4 w-4" /> Open app
            </ButtonLink>
          </div>
        </div>
      </section>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-[12.5px] text-muted sm:px-6">
          <span>Map data © OpenStreetMap contributors. Weather by Open-Meteo.</span>
          <span>Prices are estimates. Check fares and hours before you book.</span>
        </div>
      </div>
    </div>
  );
}

