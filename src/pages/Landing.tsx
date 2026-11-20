import { ArrowRight, BusFront, CalendarClock, Check, Map, PencilRuler, Share2, Sparkles, Wallet } from 'lucide-react';
import { Logo } from '../components/layout/Logo';
import { ThemeToggle } from '../components/layout/ThemeToggle';
import { ButtonLink } from '../components/ui/Button';
import { BRAND } from '../config';
import { dayColor } from '../components/map/colors';

const FEATURES = [
  { icon: Map, title: 'Live map with real routes', body: 'Every stop on an OpenStreetMap map, with road routes for each day, search, and drop-a-pin to add places.' },
  { icon: BusFront, title: 'Your choice of transport', body: 'Sleeper bus, train, flight, own car or bike. Overnight journeys are scheduled so you arrive with a full day ahead.' },
  { icon: CalendarClock, title: 'Timed day-by-day plan', body: 'Opening hours, sunset spots, lunch and travel time between places are all worked into each day.' },
  { icon: Wallet, title: 'Budget per person', body: 'Travel, rooms, food, scooters and entry fees, split across the group and checked against your cap, with ways to save.' },
  { icon: PencilRuler, title: 'Edit everything', body: 'Reorder stops, add places from suggestions, search or the map, and the times update to fit.' },
  { icon: Share2, title: 'Share, print, export', body: 'Send a view-only link, add the plan to your calendar, or export it. Your friends can save their own copy.' },
];

const PREVIEW = [
  { t: '10:30 AM', title: 'Calangute Beach', cost: '' },
  { t: '12:15 PM', title: 'Baga Beach', cost: '' },
  { t: '1:30 PM', title: 'Lunch in North Goa', cost: '' },
  { t: '5:00 PM', title: 'Chapora Fort at sunset', cost: 'Free' },
  { t: '7:45 PM', title: 'Dinner in Vagator', cost: '' },
];

export default function Landing() {
  return (
    <div className="min-h-full">
      <header className="sticky z-[1000] border-b border-line bg-bg/90 backdrop-blur" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-1 sm:gap-2">
            <a href="#features" className="hidden rounded-lg px-3 py-2 text-[14px] text-muted hover:text-ink sm:block">
              Features
            </a>
            <a href="#roadmap" className="hidden rounded-lg px-3 py-2 text-[14px] text-muted hover:text-ink sm:block">
              Roadmap
            </a>
            <ThemeToggle />
            <ButtonLink to="/app/trips" size="sm">
              Open app
            </ButtonLink>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:py-20">
        <div>
          <div className="eyebrow mb-3">Trip planning for groups</div>
          <h1 className="text-[40px] font-bold leading-[1.05] tracking-tight sm:text-[54px]">
            From “let's go to Goa” to a plan everyone can follow.
          </h1>
          <p className="mt-5 max-w-[52ch] text-[17px] text-muted">
            {BRAND.name} turns where you're going, how you'll travel and what you can spend into a timed day-by-day itinerary, a live route map and a budget split across your group.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <ButtonLink to="/app/new" size="lg">
              Plan a trip <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink to="/app/new?sample=goa" size="lg" variant="secondary">
              Try the Goa and Gokarna sample
            </ButtonLink>
          </div>
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[13.5px] text-muted">
            {['No sign-up needed', 'Works on your phone', 'Free during beta'].map((x) => (
              <li key={x} className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-ok" /> {x}
              </li>
            ))}
          </ul>
        </div>

        {/* Product preview built from real UI pieces */}
        <div className="relative">
          <div className="card overflow-hidden shadow-pop">
            <div className="flex items-center gap-3 border-b border-line px-5 py-3.5">
              <span className="grid h-9 w-9 place-items-center rounded-full font-display font-bold text-white" style={{ background: dayColor(1) }}>
                2
              </span>
              <div>
                <div className="eyebrow">Sun 22 Nov</div>
                <div className="font-semibold">North Goa: beaches and a fort at sunset</div>
              </div>
            </div>
            <ol className="divide-y divide-line">
              {PREVIEW.map((p, i) => (
                <li key={p.title} className="grid grid-cols-[84px_1fr_auto] items-center gap-3 px-5 py-2.5 text-[14px]">
                  <span className="font-mono text-[12px] text-muted">{p.t}</span>
                  <span className="flex items-center gap-2">
                    {!p.title.startsWith('Lunch') && !p.title.startsWith('Dinner') ? (
                      <span className="grid h-5 w-5 place-items-center rounded-full text-[10.5px] font-semibold text-white" style={{ background: dayColor(1) }}>
                        {i < 2 ? i + 1 : i}
                      </span>
                    ) : (
                      <span className="h-5 w-5" />
                    )}
                    {p.title}
                  </span>
                  <span className="text-[12px] text-muted">{p.cost}</span>
                </li>
              ))}
            </ol>
            <div className="border-t border-line bg-sunken px-5 py-4">
              <div className="flex items-baseline justify-between">
                <span className="text-[13px] text-muted">Per person, 6 days, 4 friends</span>
                <span className="font-display text-[22px] font-bold">₹9,890</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface">
                <div className="h-full w-[99%] rounded-full bg-ok" />
              </div>
              <div className="mt-1 text-[12.5px] font-semibold text-ok">₹110 under the ₹10,000 cap</div>
            </div>
          </div>
          <div className="absolute -bottom-4 -left-4 hidden rounded-lg border border-line bg-surface px-3 py-2 text-[12.5px] shadow-pop sm:block">
            <span className="font-semibold">AC sleeper bus</span> · Hyderabad → Goa · 13h 30m overnight
          </div>
        </div>
      </section>

      <section id="features" className="border-t border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="max-w-[24ch] text-[30px] font-bold leading-tight">Everything a group trip needs, worked out together</h2>
          <div className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title}>
                <Icon className="h-6 w-6 text-brand" />
                <h3 className="mt-3 text-[17px] font-semibold">{title}</h3>
                <p className="mt-1.5 text-[14.5px] text-muted">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-[30px] font-bold">How it works</h2>
        <ol className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            ['Tell us the basics', 'Starting city, destinations in order, dates, group size and budget per person.'],
            ['Pick how you travel', 'Transport there and back, how you get around, where you stay, food style and pace.'],
            ['Get the plan, then tune it', 'A timed itinerary, route map and budget. Move stops, add places, apply savings.'],
          ].map(([t, b], i) => (
            <li key={t} className="card p-5">
              <div className="font-mono text-[12px] text-muted">Step {i + 1}</div>
              <h3 className="mt-1 text-[17px] font-semibold">{t}</h3>
              <p className="mt-1.5 text-[14px] text-muted">{b}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="roadmap" className="border-t border-line bg-surface">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-16 sm:px-6 md:grid-cols-2">
          <div className="rounded-xl border border-brand/40 bg-brand-soft p-6">
            <div className="eyebrow text-brand">Phase 1 · Live now</div>
            <h3 className="mt-1 text-[20px] font-semibold">The planner</h3>
            <ul className="mt-4 space-y-2 text-[14.5px]">
              {['Rule-based itinerary engine with real timings', '14 curated destinations, plus any town via OpenStreetMap', 'Live maps, routing and place search', 'Budgets, savings tips, checklists, sharing and exports'].map((x) => (
                <li key={x} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" /> {x}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-dashed border-line p-6">
            <div className="eyebrow flex items-center gap-1.5 text-accent">
              <Sparkles className="h-3.5 w-3.5" /> Phase 2 · Next
            </div>
            <h3 className="mt-1 text-[20px] font-semibold">AI assistant with Gemini</h3>
            <ul className="mt-4 space-y-2 text-[14.5px] text-muted">
              {['Suggests places that match your group', 'Rewrites a day when you ask in plain words', 'Answers questions about your trip', 'Accounts and sync across devices'].map((x) => (
                <li key={x} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-muted" /> {x}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
        <h2 className="text-[30px] font-bold">Your next trip starts here</h2>
        <p className="mx-auto mt-2 max-w-[50ch] text-muted">Plan it in a few minutes, share it with your group, and keep everyone on the same page.</p>
        <ButtonLink to="/app/new" size="lg" className="mt-6">
          Plan a trip <ArrowRight className="h-4 w-4" />
        </ButtonLink>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-[13px] text-muted sm:px-6">
          <span>
            © {new Date().getFullYear()} {BRAND.name}. Map data © OpenStreetMap contributors.
          </span>
          <span>Prices are estimates. Check fares and hours before you book.</span>
        </div>
      </footer>
    </div>
  );
}
