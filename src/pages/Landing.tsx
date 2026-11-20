import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, BarChart3, BusFront, CalendarClock, Check, CloudSun, Command, Map, Menu, Plus, ReceiptIndianRupee, Sparkles, Ticket, Users, Wallet, X,
} from 'lucide-react';
import clsx from 'clsx';
import { Logo } from '../components/layout/Logo';
import { ThemeToggle } from '../components/layout/ThemeToggle';
import { ButtonLink, buttonClass } from '../components/ui/Button';
import { BRAND } from '../config';
import { CATEGORIES } from '../engine/expenses';
import { Donut } from '../components/charts/Charts';
import { DESTINATIONS } from '../data/destinations';
import { TRANSPORT_OPTIONS } from '../components/options';
import { DestinationPhoto } from '../components/ui/Photo';
import { CountUp } from '../components/ui/CountUp';
import { dayColor } from '../components/map/colors';
import { useReducedMotion, useReveal } from '../lib/motion';

const FEATURES = [
  { icon: CalendarClock, title: 'Timed day-by-day plans', body: 'Opening hours, sunset spots, meals and travel time between stops are worked into every day, automatically.' },
  { icon: Map, title: 'Live maps and routes', body: 'OpenStreetMap with real road routes per day, place search, drop-a-pin and Google Maps links on every stop.' },
  { icon: BusFront, title: 'Every way to travel', body: 'Sleeper buses, trains, flights, your own car or bike. Overnight journeys save a hotel night.' },
  { icon: ReceiptIndianRupee, title: 'Expense tracking', body: 'Log spends in seconds during the trip. See what is spent, what is left and your daily allowance.' },
  { icon: Users, title: 'Split and settle up', body: 'Track who paid and who shares. Itinera works out the transfers that settle the group.' },
  { icon: Ticket, title: 'Bookings in one place', body: 'Tickets and stays with PNRs and confirmation numbers, suggested straight from your plan.' },
  { icon: Wallet, title: 'Budget against a cap', body: 'Planned cost per person, category by category, with one-click ways to save when you go over.' },
  { icon: CloudSun, title: 'Weather on your dates', body: 'Forecasts for each destination on the days you are there, as soon as they are available.' },
  { icon: BarChart3, title: 'Reports', body: 'Spend by category, by traveller, by month and across trips. Export everything to CSV.' },
];

const STEPS = [
  ['Plan', 'Pick where you start, destinations in order, dates, group size and budget per person.'],
  ['Shape', 'Choose transport, stays and pace. Edit the timed plan on the map and add places.'],
  ['Book', 'Turn suggested journeys and stays into bookings with PNRs and confirmation numbers.'],
  ['Spend and settle', 'Log expenses on the go, watch the remaining budget, and settle up at the end.'],
] as const;

const FAQ = [
  ['Do I need an account?', 'No. Itinera runs in your browser and keeps your trips there. Export a backup from Settings whenever you like, and restore it on another device.'],
  ['Where is my data stored?', 'In this browser’s local storage. Share links carry the trip inside the link itself, so nothing is uploaded. Expenses and bookings stay out of share links unless you include them.'],
  ['How accurate are prices and timings?', 'Fares, room rates and entry fees are typical figures for India and are estimates. Opening hours come from the catalog and OpenStreetMap. Check before you book.'],
  ['Can I plan a town that isn’t in the catalog?', 'Yes. Search any town while planning and Itinera pulls its attractions from OpenStreetMap.'],
  ['What does the AI assistant need?', 'A free Gemini API key from Google AI Studio, or a proxy set up by whoever runs the site. Your key stays in your browser and is never included in backups or share links. The planner works fully without AI.'],
  ['Does it work on my phone?', 'Yes. Every screen has a phone layout, and you can add the site to your home screen.'],
] as const;

const demo = [
  { key: 'transport', value: 6120 },
  { key: 'stay', value: 6840 },
  { key: 'food', value: 9480 },
  { key: 'local', value: 2600 },
  { key: 'activities', value: 1900 },
  { key: 'shopping', value: 1250 },
];

const PLACE_COUNT = DESTINATIONS.reduce((a, d) => a + d.places.length, 0);

function useScrolled(px = 24) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > px);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, [px]);
  return scrolled;
}

export default function Landing() {
  const scrolled = useScrolled();
  const [menu, setMenu] = useState(false);

  return (
    <div className="min-h-full bg-surface">
      <SiteHeader scrolled={scrolled} menu={menu} setMenu={setMenu} />
      <Hero />
      <Destinations />
      <Features />
      <Numbers />
      <HowItWorks />
      <Roadmap />
      <Faq />
      <Cta />
      <SiteFooter />
    </div>
  );
}

/* ───────────────────────────── Header ───────────────────────────── */

function SiteHeader({ scrolled, menu, setMenu }: { scrolled: boolean; menu: boolean; setMenu: (v: boolean) => void }) {
  const links = [
    ['#destinations', 'Destinations'],
    ['#features', 'Features'],
    ['#how', 'How it works'],
    ['#faq', 'FAQ'],
  ];
  // Over the dark hero the header is transparent with light text; once scrolled it becomes a surface.
  const onDark = !scrolled && !menu;
  return (
    <header
      className={clsx(
        'fixed inset-x-0 z-[1000] border-b transition-[background-color,border-color,color] duration-300 ease-out-soft',
        onDark ? 'border-transparent bg-transparent text-white' : 'border-line bg-surface/90 text-ink backdrop-blur',
      )}
      style={{ top: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className={clsx(onDark && '[&_span]:text-white')}>
          <Logo />
        </div>
        <nav className="flex items-center gap-1" aria-label="Site">
          {links.map(([href, label]) => (
            <a
              key={href}
              href={href}
              onClick={(e) => {
                e.preventDefault();
                document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={clsx('hidden rounded-lg px-3 py-1.5 text-[13.5px] transition-colors md:block', onDark ? 'text-white/75 hover:bg-white/10 hover:text-white' : 'text-ink-2 hover:bg-sunken')}
            >
              {label}
            </a>
          ))}
          <ThemeToggle className={clsx(onDark && 'text-white/75 hover:bg-white/10 hover:text-white')} />
          <ButtonLink to="/app/home" size="sm" className={clsx('hidden sm:inline-flex', onDark && '!bg-white !text-[#0b0d14] hover:!bg-white/90')}>
            Open app
          </ButtonLink>
          <button
            type="button"
            aria-label={menu ? 'Close menu' : 'Open menu'}
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
            className={clsx('inline-grid h-9 w-9 place-items-center rounded-lg transition-colors md:hidden', onDark ? 'hover:bg-white/10' : 'hover:bg-sunken')}
          >
            {menu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>
      </div>
      {menu && (
        <div className="menu-in border-t border-line bg-surface px-4 pb-4 pt-2 md:hidden">
          {links.map(([href, label]) => (
            <a key={href} href={href} onClick={(e) => { e.preventDefault(); setMenu(false); document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' }); }} className="block rounded-lg px-3 py-2.5 text-[15px] text-ink-2 hover:bg-sunken">
              {label}
            </a>
          ))}
          <ButtonLink to="/app/home" className="mt-2 w-full">
            Open app
          </ButtonLink>
        </div>
      )}
    </header>
  );
}

/* ───────────────────────────── Hero ───────────────────────────── */

function HeroVideo() {
  const reduced = useReducedMotion();
  // Respect data saver: show the still frame instead of streaming video.
  const saveData = typeof navigator !== 'undefined' && (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  const [ready, setReady] = useState(false);
  const still = reduced || saveData;
  const base = import.meta.env.BASE_URL;
  return (
    <div aria-hidden="true" className="absolute inset-0">
      <img src={`${base}media/hero-poster.jpg`} alt="" className="absolute inset-0 h-full w-full object-cover object-[70%_40%]" {...{ fetchpriority: 'high' }} />
      {!still && (
        <video
          className={clsx('photo-in absolute inset-0 h-full w-full object-cover object-[70%_40%]', ready ? 'opacity-100' : 'opacity-0')}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={`${base}media/hero-poster.jpg`}
          onCanPlay={() => setReady(true)}
        >
          <source src={`${base}media/hero-loop.webm`} type="video/webm" />
          <source src={`${base}media/hero-loop.mp4`} type="video/mp4" />
        </video>
      )}
      {/* Keep the headline side calm and blend the bottom into the product view */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0b0d14] via-[#0b0d14]/80 to-[#0b0d14]/30 lg:via-[#0b0d14]/40 lg:to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0b0d14] to-transparent" />
    </div>
  );
}

function Hero() {
  const total = demo.reduce((a, d) => a + d.value, 0);
  return (
    <section className="relative overflow-hidden bg-[#0b0d14] text-white">
      <HeroVideo />
      <div className="relative mx-auto max-w-6xl px-4 pb-0 pt-32 sm:px-6 md:pt-40">
        <div className="stagger max-w-[38rem]">
          <a
            href="#roadmap"
            style={{ '--i': 0 } as CSSProperties}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[12.5px] text-white/80 backdrop-blur transition-colors hover:bg-white/10"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#f5a646]" /> Trip assistant with Gemini, optional
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
          <h1 style={{ '--i': 1 } as CSSProperties} className="font-serif text-[44px] font-normal leading-[1.02] tracking-[-0.01em] sm:text-[64px] lg:text-[72px]">
            Plan the trip.
            <br />
            <span className="text-[#9db7ff]">Track every rupee.</span>
          </h1>
          <p style={{ '--i': 2 } as CSSProperties} className="mt-6 max-w-[34rem] text-[17px] leading-relaxed text-white/70 sm:text-[18px]">
            {BRAND.name} turns your destinations, dates, transport and budget into a timed itinerary with live maps, then tracks what the group spends, who owes whom, and what is left.
          </p>
          <div style={{ '--i': 3 } as CSSProperties} className="mt-8 flex flex-wrap gap-3">
            <Link to="/app/new" className={buttonClass('primary', 'lg', '!bg-white !text-[#0b0d14] hover:!bg-white/90')}>
              Plan a trip <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/app/new?sample=goa" className={buttonClass('ghost', 'lg', 'border border-white/20 !text-white hover:!bg-white/10')}>
              Try the Goa sample
            </Link>
          </div>
          <ul style={{ '--i': 4 } as CSSProperties} className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-white/60">
            {['No sign-up', 'Your data stays in your browser', 'Free during beta'].map((x) => (
              <li key={x} className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-[#7ee2b0]" /> {x}
              </li>
            ))}
          </ul>
        </div>

        {/* Product view rising from the bottom edge, built from the real UI pieces */}
        <div className="dialog-in relative mt-16 md:ml-auto md:mt-20 md:w-[88%] lg:w-[78%]" style={{ animationDelay: '320ms' }}>
          <div className="overflow-hidden rounded-t-2xl border border-b-0 border-white/10 bg-surface text-ink shadow-[0_-24px_80px_-24px_rgb(112_152_255/0.25)]">
            <div className="flex items-center gap-2 border-b border-line bg-sunken/70 px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
              <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
              <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
              <span className="ml-3 truncate text-[12px] text-muted">Goa and Gokarna with friends · Expenses</span>
            </div>
            <div className="grid grid-cols-3 gap-px border-b border-line bg-line">
              {[
                ['Spent so far', 28190, '70% of ₹40,000 cap', 'text-ink'],
                ['Remaining', 11810, '₹5,905 a day', 'text-ok'],
                ['Per person', 7048, 'of ₹10,000 each', 'text-ink'],
              ].map(([l, v, s, c]) => (
                <div key={l as string} className="bg-surface px-4 py-3 sm:px-5 sm:py-4">
                  <div className="text-[11.5px] text-muted">{l}</div>
                  <div className={`text-[17px] font-semibold tabular sm:text-[22px] ${c}`}>
                    <CountUp value={v as number} format={(n) => '₹' + Math.round(n).toLocaleString('en-IN')} duration={1400} />
                  </div>
                  <div className="truncate text-[11px] text-muted">{s}</div>
                </div>
              ))}
            </div>
            <div className="grid sm:grid-cols-[auto_1fr_1.1fr]">
              <div className="grid place-items-center p-5">
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
              </div>
              <ul className="min-w-0 space-y-1.5 self-center px-5 pb-5 text-[12.5px] sm:px-0 sm:pb-0 sm:pr-5">
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
              <div className="hidden border-l border-line sm:block">
                {[
                  ['Dinner at Vagator', 'Food · Paid by Rahul · split 4 ways', '₹2,480'],
                  ['Scooters, 2 days', 'Getting around · Paid by You', '₹1,600'],
                  ['Om Beach boat', 'Activities · Paid by Arjun', '₹1,400'],
                  ['Arjun pays Rahul', 'Settle up', '₹1,240'],
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
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────── Sections ───────────────────────────── */

function SectionHead({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className="reveal max-w-2xl">
      <div className="reveal-item text-[13px] font-medium text-brand">{eyebrow}</div>
      <h2 className="reveal-item mt-2 text-[30px] font-semibold leading-tight tracking-tight sm:text-[36px]" style={{ '--i': 1 } as CSSProperties}>
        {title}
      </h2>
      {children && (
        <p className="reveal-item mt-3 text-[15.5px] leading-relaxed text-muted" style={{ '--i': 2 } as CSSProperties}>
          {children}
        </p>
      )}
    </div>
  );
}

function Destinations() {
  const ref = useReveal<HTMLUListElement>();
  return (
    <section id="destinations" className="scroll-mt-16 border-b border-line bg-surface py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHead eyebrow="Ready to plan" title={`${DESTINATIONS.length} destinations, ${PLACE_COUNT} places`}>
            Each place has real coordinates, opening hours, entry fees and a note. Any other town works too, straight from OpenStreetMap.
          </SectionHead>
          <ButtonLink to="/app/explore" variant="secondary">
            Explore all <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>
      </div>
      <ul
        ref={ref}
        className="reveal mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:thin] sm:px-6 lg:px-[max(1.5rem,calc((100vw_-_72rem)/2_+_1.5rem))] lg:scroll-pl-[max(1.5rem,calc((100vw_-_72rem)/2_+_1.5rem))]"
        aria-label="Destinations"
      >
        {DESTINATIONS.map((d, i) => (
          <li key={d.id} className="reveal-item w-[240px] shrink-0 snap-start sm:w-[280px]" style={{ '--i': i } as CSSProperties}>
            <Link to={`/app/new?dest=${d.id}`} className="lift group block overflow-hidden rounded-2xl border border-line bg-surface">
              <DestinationPhoto dest={d} color={dayColor(i)} zoomOnHover credit={false} sizes="280px" className="aspect-[4/5]">
                <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute inset-x-4 bottom-4 text-white">
                  <div className="text-[17px] font-semibold drop-shadow-sm">{d.name}</div>
                  <div className="mt-0.5 flex items-center justify-between text-[12.5px] text-white/80">
                    <span>{d.state}</span>
                    <span className="tabular">{d.places.length} places</span>
                  </div>
                </div>
              </DestinationPhoto>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Features() {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section id="features" className="scroll-mt-16 mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
      <SectionHead eyebrow="Everything in one workspace" title="From the first idea to the last settle-up">
        Planning, booking, spending and splitting usually live in five different apps. Here they share one plan, so every number stays in sync.
      </SectionHead>
      <div ref={ref} className="reveal mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, body }, i) => (
          <div key={title} className="reveal-item group bg-surface p-6 transition-colors hover:bg-sunken/40" style={{ '--i': i } as CSSProperties}>
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-soft text-brand transition-transform duration-300 ease-out-soft group-hover:-translate-y-0.5">
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </span>
            <h3 className="mt-4 text-[15.5px] font-semibold">{title}</h3>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Numbers() {
  const ref = useReveal<HTMLDivElement>();
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mo = new MutationObserver(() => el.dataset.revealed === 'true' && setOn(true));
    mo.observe(el, { attributes: true, attributeFilter: ['data-revealed'] });
    if (el.dataset.revealed === 'true') setOn(true);
    return () => mo.disconnect();
  }, [ref]);
  const items: [number, string][] = [
    [DESTINATIONS.length, 'curated destinations'],
    [PLACE_COUNT, 'places with hours and fees'],
    [TRANSPORT_OPTIONS.length, 'ways to travel between cities'],
    [0, 'accounts or API keys needed'],
  ];
  return (
    <section className="border-y border-line bg-bg">
      <div ref={ref} className="reveal mx-auto grid max-w-6xl grid-cols-2 gap-px px-4 sm:px-6 lg:grid-cols-4">
        {items.map(([n, label], i) => (
          <div key={label} className="reveal-item py-10 sm:py-12" style={{ '--i': i } as CSSProperties}>
            <div className="font-serif text-[48px] leading-none tabular sm:text-[60px]">{on ? <CountUp value={n} duration={1200} /> : 0}</div>
            <div className="mt-2 text-[13.5px] text-muted">{label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const ref = useReveal<HTMLOListElement>();
  return (
    <section id="how" className="scroll-mt-16 mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
      <SectionHead eyebrow="How it works" title="Four steps, one plan" />
      <ol ref={ref} className="reveal relative mt-12 grid gap-8 md:grid-cols-4 md:gap-6">
        {/* The signature route line: drawn across the steps as they come into view */}
        <svg aria-hidden="true" className="how-line absolute left-4 right-4 top-3 hidden h-2 md:block" style={{ width: 'calc(100% - 2rem)' }} viewBox="0 0 100 2" preserveAspectRatio="none">
          <path d="M0 1 H100" stroke="rgb(var(--brand))" strokeWidth="2" strokeDasharray="2 6" strokeLinecap="round" vectorEffect="non-scaling-stroke" fill="none" />
        </svg>
        {STEPS.map(([t, b], i) => (
          <li key={t} className="reveal-item relative" style={{ '--i': i + 1 } as CSSProperties}>
            <span className="relative grid h-8 w-8 place-items-center rounded-full bg-brand text-[13px] font-semibold text-brand-ink ring-4 ring-surface">{i + 1}</span>
            <h3 className="mt-4 text-[16px] font-semibold">{t}</h3>
            <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{b}</p>
          </li>
        ))}
      </ol>
      <div className="mt-12 flex flex-wrap items-center gap-2 text-[13px] text-muted">
        <Command className="h-4 w-4" /> Press <span className="kbd">Ctrl</span> <span className="kbd">K</span> anywhere in the app to jump to a trip or log an expense.
      </div>
    </section>
  );
}

function Roadmap() {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section id="roadmap" className="scroll-mt-16 border-t border-line bg-bg">
      <div ref={ref} className="reveal mx-auto grid max-w-6xl gap-6 px-4 py-20 sm:px-6 md:grid-cols-2">
        <div className="reveal-item rounded-2xl border border-line bg-surface p-7 shadow-card">
          <div className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ok">
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
        <div className="reveal-item rounded-2xl border border-line bg-surface p-7 shadow-card" style={{ '--i': 1 } as CSSProperties}>
          <div className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-accent">
            <Sparkles className="h-3.5 w-3.5" /> Optional · Gemini
          </div>
          <h3 className="mt-3 text-[20px] font-semibold">Trip assistant</h3>
          <ul className="mt-5 space-y-2.5 text-[14px]">
            {['Ask anything about your trip, budget or who owes whom', 'Change the plan in plain words, then preview and apply', 'Place ideas that suit your group', 'Scan a bill or UPI screenshot into an expense', 'Describe a trip in one sentence and get the form filled'].map((x) => (
              <li key={x} className="flex gap-2.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" /> {x}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-[12.5px] text-muted">Next: accounts and sync across devices</p>
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="scroll-mt-16 mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1fr_1.6fr]">
      <SectionHead eyebrow="Questions" title="Before you plan">
        Short answers about data, prices and the AI assistant.
      </SectionHead>
      <div className="divide-y divide-line border-y border-line">
        {FAQ.map(([q, a], i) => {
          const isOpen = open === i;
          return (
            <div key={q} data-open={isOpen}>
              <h3>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`faq-${i}`}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left text-[15.5px] font-medium transition-colors hover:text-brand"
                >
                  {q}
                  <Plus className="accordion-chevron h-4 w-4 shrink-0 text-muted" />
                </button>
              </h3>
              <div id={`faq-${i}`} role="region" className="accordion-body" aria-hidden={!isOpen}>
                <div>
                  <p className="pb-5 pr-8 text-[14px] leading-relaxed text-muted">{a}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Cta() {
  const base = import.meta.env.BASE_URL;
  return (
    <section className="relative overflow-hidden bg-[#0b0d14] text-white">
      <img src={`${base}media/hero-poster.jpg`} alt="" aria-hidden="true" loading="lazy" className="absolute inset-0 h-full w-full object-cover object-[80%_40%] opacity-70" />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-[#0b0d14] via-[#0b0d14]/80 to-transparent" />
      <div className="relative mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-4 py-20 sm:px-6 md:flex-row md:items-center">
        <div>
          <h2 className="font-serif text-[36px] font-normal leading-tight sm:text-[44px]">Your next trip, fully under control</h2>
          <p className="mt-2 text-white/70">Plan it in minutes. Share it with the group. Keep every rupee accounted for.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/app/new" className={buttonClass('primary', 'lg', '!bg-white !text-[#0b0d14] hover:!bg-white/90')}>
            Plan a trip <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/app/home" className={buttonClass('ghost', 'lg', 'border border-white/20 !text-white hover:!bg-white/10')}>
            Open app
          </Link>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  const cols: [string, [string, string][]][] = [
    ['Product', [['#features', 'Features'], ['#how', 'How it works'], ['#roadmap', 'Roadmap'], ['#faq', 'FAQ']]],
    ['App', [['/app/new', 'Plan a trip'], ['/app/explore', 'Explore destinations'], ['/app/trips', 'Your trips'], ['/app/settings', 'Settings and backup']]],
  ];
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-[32ch] text-[13.5px] text-muted">{BRAND.tagline}. Timed plans, live maps and group money, in your browser.</p>
        </div>
        {cols.map(([title, links]) => (
          <div key={title}>
            <div className="text-[13px] font-medium">{title}</div>
            <ul className="mt-3 space-y-2 text-[13.5px] text-muted">
              {links.map(([to, label]) => (
                <li key={to}>
                  {to.startsWith('#') ? (
                    <a href={to} onClick={(e) => { e.preventDefault(); document.querySelector(to)?.scrollIntoView({ behavior: 'smooth' }); }} className="transition-colors hover:text-ink">
                      {label}
                    </a>
                  ) : (
                    <Link to={to} className="transition-colors hover:text-ink">
                      {label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-[12.5px] text-muted sm:px-6">
          <span>Map data © OpenStreetMap contributors. Weather by Open-Meteo. Photos from Wikimedia Commons.</span>
          <span>Prices are estimates. Check fares and hours before you book.</span>
        </div>
      </div>
    </footer>
  );
}
