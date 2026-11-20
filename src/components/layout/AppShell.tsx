import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { BarChart3, Compass, Home, Map, Menu, Plus, ReceiptIndianRupee, Search, Settings as Cog, Sparkles, X } from 'lucide-react';
import clsx from 'clsx';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { CommandPalette } from './CommandPalette';
import { useSettings } from '../../store/settings';
import { useAllTrips } from '../../store/trips';
import { ButtonLink } from '../ui/Button';
import { Avatar, Dot } from '../ui/Kit';
import { tripPhase } from '../../engine/expenses';
import { useAI, useAIReady } from '../../store/ai';
import { dayColor } from '../map/colors';

const NAV = [
  { to: '/app/home', label: 'Home', icon: Home },
  { to: '/app/trips', label: 'Trips', icon: Map },
  { to: '/app/expenses', label: 'Expenses', icon: ReceiptIndianRupee },
  { to: '/app/reports', label: 'Reports', icon: BarChart3 },
  { to: '/app/explore', label: 'Explore', icon: Compass },
];

export default function AppShell() {
  const [open, setOpen] = useState(false);
  const [palette, setPalette] = useState(false);
  const { pathname } = useLocation();
  const workspace = useSettings((s) => s.workspaceName);
  const name = useSettings((s) => s.displayName);
  const trips = useAllTrips();
  const recent = trips.slice(0, 6);
  const aiOn = useAIReady();
  const aiModel = useAI((s) => s.model);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const sidebar = (
    <nav className="flex h-full flex-col" aria-label="Main">
      <div className="flex h-14 items-center justify-between border-b border-line px-4">
        <Logo to="/app/home" />
        <button className="rounded-md p-1 text-muted lg:hidden" aria-label="Close menu" onClick={() => setOpen(false)}>
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        <div className="px-1">
          <div className="flex items-center gap-2.5 rounded-lg border border-line bg-sunken/60 px-2.5 py-2">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-brand text-[12px] font-bold text-brand-ink">{(workspace || 'W')[0].toUpperCase()}</span>
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold">{workspace}</div>
              <div className="text-[11.5px] text-muted">Free plan · {trips.length} trip{trips.length === 1 ? '' : 's'}</div>
            </div>
          </div>
        </div>
        <ul className="space-y-0.5">
          {NAV.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/app/trips'}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13.5px] font-medium transition-colors',
                    isActive || (to === '/app/trips' && pathname.startsWith('/app/trips/'))
                      ? 'bg-sunken text-ink'
                      : 'text-ink-2 hover:bg-sunken hover:text-ink',
                  )
                }
              >
                <Icon className="h-4 w-4 opacity-80" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
        {recent.length > 0 && (
          <div>
            <div className="mb-1.5 flex items-center justify-between px-2.5">
              <span className="eyebrow">Trips</span>
              <Link to="/app/new" className="rounded p-0.5 text-muted hover:bg-sunken hover:text-ink" aria-label="Plan a trip">
                <Plus className="h-3.5 w-3.5" />
              </Link>
            </div>
            <ul className="space-y-0.5">
              {recent.map((t, i) => {
                const phase = tripPhase(t);
                return (
                  <li key={t.id}>
                    <NavLink
                      to={`/app/trips/${t.id}`}
                      className={({ isActive }) =>
                        clsx('flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px]', isActive ? 'bg-sunken text-ink' : 'text-ink-2 hover:bg-sunken hover:text-ink')
                      }
                    >
                      <Dot color={dayColor(i)} />
                      <span className="min-w-0 flex-1 truncate">{t.input.name}</span>
                      {phase.kind === 'live' && <span className="rounded bg-ok-soft px-1.5 text-[10.5px] font-semibold text-ok">LIVE</span>}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
      <div className="space-y-2 border-t border-line p-3">
        <Link to="/app/settings#ai" className="flex items-start gap-2 rounded-lg bg-sunken/70 px-3 py-2.5 text-[12px] text-muted hover:bg-sunken">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 font-semibold text-ink-2">
              Gemini AI
              <span className={clsx('h-1.5 w-1.5 rounded-full', aiOn ? 'bg-ok' : 'bg-line-strong')} />
              <span className="font-normal text-muted">{aiOn ? 'On' : 'Off'}</span>
            </span>
            <span className="block truncate">{aiOn ? `Using ${aiModel}` : 'Set up the trip assistant'}</span>
          </span>
        </Link>
        <NavLink
          to="/app/settings"
          className={({ isActive }) => clsx('flex items-center gap-2.5 rounded-lg px-2 py-1.5', isActive ? 'bg-sunken' : 'hover:bg-sunken')}
        >
          <Avatar person={{ name: name || 'Guest', color: '#2557d6' }} size={28} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium">{name || 'Guest planner'}</span>
            <span className="block truncate text-[11.5px] text-muted">Settings and data</span>
          </span>
          <Cog className="h-4 w-4 text-muted" />
        </NavLink>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-full">
      <aside className="no-print sticky top-0 hidden h-[calc(100vh-40px)] w-60 shrink-0 border-r border-line bg-surface lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-[1200] lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="animate-in absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-line bg-surface">{sidebar}</aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky z-[1000] flex h-14 items-center gap-3 border-b border-line bg-surface/90 px-4 backdrop-blur sm:px-6" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
          <button aria-label="Open menu" className="-ml-1 rounded-md p-1.5 text-ink hover:bg-sunken lg:hidden" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="lg:hidden">
            <Logo to="/app/home" compact />
          </div>
          <button
            onClick={() => setPalette(true)}
            aria-label="Search"
            className="ml-auto flex h-9 min-w-0 max-w-[22rem] items-center gap-2 rounded-lg border border-line-strong bg-sunken/60 px-2.5 text-[13px] text-muted hover:bg-sunken sm:flex-1 sm:px-3 lg:ml-0"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="hidden flex-1 truncate text-left sm:block">Search trips, places, actions…</span>
            <span className="kbd hidden sm:inline-flex">Ctrl K</span>
          </button>
          <div className="flex shrink-0 items-center gap-1.5 sm:ml-auto">
            <ThemeToggle />
            <ButtonLink to="/app/new" size="sm" icon={<Plus className="h-4 w-4" />} className="hidden sm:inline-flex">
              New trip
            </ButtonLink>
          </div>
        </header>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </div>
  );
}

export function Page({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return <div className={clsx('mx-auto w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8', wide ? 'max-w-[1440px]' : 'max-w-[1200px]')}>{children}</div>;
}

export { PageHeader } from '../ui/Kit';
