import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Compass, CornerDownLeft, Home, Map, Plus, ReceiptIndianRupee, Search, Settings, Wallet } from 'lucide-react';
import clsx from 'clsx';
import { useAllTrips } from '../../store/trips';
import { DESTINATIONS } from '../../data/destinations';
import { tripPhase } from '../../engine/expenses';

interface Item {
  id: string;
  label: string;
  hint?: string;
  group: string;
  icon: typeof Home;
  run: () => void;
}

/** Ctrl/Cmd+K launcher for navigation and quick actions. */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('');
  const [hi, setHi] = useState(0);
  const navigate = useNavigate();
  const trips = useAllTrips();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const items = useMemo<Item[]>(() => {
    const go = (to: string) => () => {
      navigate(to);
      onClose();
    };
    const out: Item[] = [
      { id: 'new', label: 'Plan a new trip', group: 'Actions', icon: Plus, run: go('/app/new') },
    ];
    const live = trips.find((t) => tripPhase(t).kind === 'live') ?? trips[0];
    if (live) out.push({ id: 'add-exp', label: `Add expense to ${live.input.name}`, group: 'Actions', icon: Wallet, run: go(`/app/trips/${live.id}?tab=expenses&add=1`) });
    out.push(
      { id: 'home', label: 'Home', group: 'Go to', icon: Home, run: go('/app/home') },
      { id: 'trips', label: 'Trips', group: 'Go to', icon: Map, run: go('/app/trips') },
      { id: 'expenses', label: 'Expenses', group: 'Go to', icon: ReceiptIndianRupee, run: go('/app/expenses') },
      { id: 'reports', label: 'Reports', group: 'Go to', icon: BarChart3, run: go('/app/reports') },
      { id: 'explore', label: 'Explore destinations', group: 'Go to', icon: Compass, run: go('/app/explore') },
      { id: 'settings', label: 'Settings', group: 'Go to', icon: Settings, run: go('/app/settings') },
    );
    trips.forEach((t) =>
      out.push({
        id: 'trip-' + t.id,
        label: t.input.name,
        hint: t.input.destinations.map((d) => d.name).join(', '),
        group: 'Trips',
        icon: Map,
        run: go(`/app/trips/${t.id}`),
      }),
    );
    DESTINATIONS.forEach((d) =>
      out.push({ id: 'dest-' + d.id, label: `Plan a trip to ${d.name}`, hint: d.state, group: 'Destinations', icon: Compass, run: go(`/app/new?dest=${d.id}`) }),
    );
    return out;
  }, [trips, navigate, onClose]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items.filter((i) => i.group !== 'Destinations');
    return items.filter((i) => `${i.label} ${i.hint ?? ''}`.toLowerCase().includes(s)).slice(0, 30);
  }, [items, q]);

  useEffect(() => {
    if (open) {
      setQ('');
      setHi(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);
  useEffect(() => setHi(0), [q]);
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-i="${hi}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [hi]);

  if (!open) return null;
  let lastGroup = '';
  return (
    <div className="fixed inset-0 z-[1600] flex items-start justify-center bg-[rgb(9_12_18/0.45)] p-4 pt-[12vh] backdrop-blur-[2px]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-label="Command palette" className="animate-in w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface shadow-pop">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="h-4 w-4 text-muted" />
          <input
            ref={inputRef}
            className="h-12 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted"
            placeholder="Type a command or search…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setHi((h) => Math.min(filtered.length - 1, h + 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setHi((h) => Math.max(0, h - 1));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                filtered[hi]?.run();
              }
            }}
            aria-label="Search commands"
          />
          <span className="kbd">Esc</span>
        </div>
        <ul ref={listRef} className="max-h-[55vh] overflow-y-auto p-2" role="listbox">
          {filtered.length === 0 && <li className="px-3 py-8 text-center text-[13.5px] text-muted">No results for “{q}”.</li>}
          {filtered.map((item, i) => {
            const header = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            const Icon = item.icon;
            return (
              <li key={item.id} role="none">
                {header && <div className="px-3 pb-1 pt-3 text-[11.5px] font-semibold uppercase tracking-wide text-muted first:pt-1">{header}</div>}
                <button
                  data-i={i}
                  role="option"
                  aria-selected={i === hi}
                  onMouseEnter={() => setHi(i)}
                  onClick={item.run}
                  className={clsx('flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13.5px]', i === hi ? 'bg-sunken' : '')}
                >
                  <Icon className="h-4 w-4 shrink-0 text-muted" />
                  <span className="min-w-0 flex-1 truncate">
                    {item.label}
                    {item.hint && <span className="ml-2 text-[12.5px] text-muted">{item.hint}</span>}
                  </span>
                  {i === hi && <CornerDownLeft className="h-3.5 w-3.5 text-muted" />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
