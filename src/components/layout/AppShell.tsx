import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Compass, LayoutGrid, Menu, Plus, Settings as Cog, Sparkles, X } from 'lucide-react';
import clsx from 'clsx';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { useSettings } from '../../store/settings';
import { useTrips } from '../../store/trips';
import { ButtonLink } from '../ui/Button';

const NAV = [
  { to: '/app/trips', label: 'Trips', icon: LayoutGrid },
  { to: '/app/explore', label: 'Explore', icon: Compass },
  { to: '/app/settings', label: 'Settings', icon: Cog },
];

export default function AppShell() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const workspace = useSettings((s) => s.workspaceName);
  const name = useSettings((s) => s.displayName);
  const recent = useTrips((s) => s.order.slice(0, 5).map((id) => s.trips[id]).filter(Boolean));

  useEffect(() => setOpen(false), [pathname]);

  const sidebar = (
    <nav className="flex h-full flex-col gap-6 p-4" aria-label="Main">
      <div className="flex items-center justify-between">
        <Logo to="/app/trips" />
        <button className="rounded-md p-1 text-muted lg:hidden" aria-label="Close menu" onClick={() => setOpen(false)}>
          <X className="h-5 w-5" />
        </button>
      </div>
      <ButtonLink to="/app/new" icon={<Plus className="h-4 w-4" />} className="w-full">
        Plan a trip
      </ButtonLink>
      <ul className="flex flex-col gap-0.5">
        {NAV.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-medium transition-colors',
                  isActive ? 'bg-brand-soft text-brand' : 'text-muted hover:bg-sunken hover:text-ink',
                )
              }
            >
              <Icon className="h-[18px] w-[18px]" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
      {recent.length > 0 && (
        <div>
          <div className="eyebrow mb-2 px-3">Recent trips</div>
          <ul className="flex flex-col gap-0.5">
            {recent.map((t) => (
              <li key={t.id}>
                <NavLink
                  to={`/app/trips/${t.id}`}
                  className={({ isActive }) =>
                    clsx('block truncate rounded-lg px-3 py-1.5 text-[13.5px]', isActive ? 'bg-sunken text-ink' : 'text-muted hover:bg-sunken hover:text-ink')
                  }
                >
                  {t.input.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-auto space-y-3">
        <div className="rounded-lg border border-dashed border-line p-3 text-[12.5px] text-muted">
          <div className="mb-1 flex items-center gap-1.5 font-semibold text-ink">
            <Sparkles className="h-3.5 w-3.5 text-accent" /> AI assistant
          </div>
          Arrives in phase 2, powered by Gemini.
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-[13.5px] font-medium">{name || 'Guest planner'}</div>
            <div className="truncate text-[12px] text-muted">{workspace}</div>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-full">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-line bg-surface lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-[1200] lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-line bg-surface">{sidebar}</aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="sticky z-[1000] flex items-center justify-between border-b border-line bg-surface/95 px-4 py-2.5 backdrop-blur lg:hidden no-print"
          style={{ top: 'env(safe-area-inset-top, 0px)' }}
        >
          <button aria-label="Open menu" className="rounded-md p-1.5 text-ink hover:bg-sunken" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <Logo to="/app/trips" />
          <ThemeToggle />
        </header>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function PageHeader({ title, eyebrow, actions, children }: { title: string; eyebrow?: string; actions?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 pb-6">
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow mb-1">{eyebrow}</div>}
        <h1 className="text-[28px] font-bold leading-tight sm:text-[32px]">{title}</h1>
        {children && <div className="mt-1.5 max-w-[65ch] text-muted">{children}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Page({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return <div className={clsx('mx-auto w-full px-4 py-6 sm:px-6 lg:py-8', wide ? 'max-w-[1400px]' : 'max-w-6xl')}>{children}</div>;
}
