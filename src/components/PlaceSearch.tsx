import { useEffect, useId, useRef, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import clsx from 'clsx';
import type { GeoPoint } from '../types';
import { searchPlaces, type SearchResult } from '../services/geo';
import { Spinner } from './ui/Spinner';

/** Typeahead over OpenStreetMap (Nominatim). Debounced to respect the 1 request/second policy. */
export function PlaceSearch({
  onSelect,
  placeholder = 'Search a place',
  near,
  countryCodes,
  id,
  autoFocus,
  clearOnSelect = true,
}: {
  onSelect: (r: SearchResult) => void;
  placeholder?: string;
  near?: GeoPoint;
  countryCodes?: string;
  id?: string;
  autoFocus?: boolean;
  clearOnSelect?: boolean;
}) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const listId = useId();
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      setError('');
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const r = await searchPlaces(q, { near, signal: ctrl.signal, countryCodes });
        setResults(r);
        setHi(0);
        setOpen(true);
        if (!r.length) setError('No matches. Try a nearby town or a different spelling.');
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setError('Search is unavailable right now. Check your connection and try again.');
      } finally {
        setLoading(false);
      }
    }, 450);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, countryCodes, near?.lat, near?.lon]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => wrap.current && !wrap.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const pick = (r: SearchResult) => {
    onSelect(r);
    setOpen(false);
    setQ(clearOnSelect ? '' : r.name);
    setResults([]);
  };

  return (
    <div ref={wrap} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          id={id}
          autoFocus={autoFocus}
          className="input pl-9 pr-9"
          placeholder={placeholder}
          value={q}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          onKeyDown={(e) => {
            if (!open || !results.length) return;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setHi((h) => Math.min(results.length - 1, h + 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHi((h) => Math.max(0, h - 1));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              pick(results[hi]);
            } else if (e.key === 'Escape') setOpen(false);
          }}
        />
        {loading && <Spinner className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />}
      </div>
      {open && (results.length > 0 || error) && (
        <ul id={listId} role="listbox" className="absolute left-0 right-0 z-[1100] mt-1 max-h-72 overflow-y-auto rounded-lg border border-line bg-surface py-1 shadow-pop">
          {error && <li className="px-3 py-2 text-[13px] text-muted">{error}</li>}
          {results.map((r, i) => (
            <li
              key={r.id}
              role="option"
              aria-selected={i === hi}
              onMouseEnter={() => setHi(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(r);
              }}
              className={clsx('flex cursor-pointer items-start gap-2.5 px-3 py-2', i === hi && 'bg-sunken')}
            >
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <span className="min-w-0">
                <span className="block truncate text-[14px] font-medium">{r.name}</span>
                <span className="block truncate text-[12px] text-muted">{r.label}</span>
              </span>
            </li>
          ))}
          <li className="px-3 pb-1 pt-1.5 text-[11px] text-muted">Search by OpenStreetMap</li>
        </ul>
      )}
    </div>
  );
}
