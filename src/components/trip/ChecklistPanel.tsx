import { useState } from 'react';
import { Plus, RotateCcw, Trash2 } from 'lucide-react';
import type { ChecklistItem, Trip } from '../../types';
import { Button, IconButton } from '../ui/Button';

const CATS: { key: ChecklistItem['category']; label: string }[] = [
  { key: 'booking', label: 'Bookings' },
  { key: 'documents', label: 'Documents' },
  { key: 'money', label: 'Money' },
  { key: 'packing', label: 'Packing' },
  { key: 'custom', label: 'Your items' },
];

export function ChecklistPanel({
  trip, readOnly, onToggle, onAdd, onRemove, onReset,
}: {
  trip: Trip; readOnly?: boolean; onToggle?: (id: string) => void; onAdd?: (label: string) => void; onRemove?: (id: string) => void; onReset?: () => void;
}) {
  const [text, setText] = useState('');
  const done = trip.checklist.filter((c) => c.done).length;
  const pct = trip.checklist.length ? Math.round((done / trip.checklist.length) * 100) : 0;
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-4">
        {CATS.map((cat) => {
          const items = trip.checklist.filter((c) => c.category === cat.key);
          if (!items.length) return null;
          return (
            <section key={cat.key} className="card overflow-hidden">
              <h3 className="border-b border-line px-5 py-3 text-[15px] font-semibold">{cat.label}</h3>
              <ul className="divide-y divide-line">
                {items.map((c) => (
                  <li key={c.id} className="flex items-start gap-3 px-5 py-3">
                    <input
                      type="checkbox"
                      id={c.id}
                      checked={c.done}
                      disabled={readOnly}
                      onChange={() => onToggle?.(c.id)}
                      className="mt-0.5 h-[18px] w-[18px] shrink-0 accent-[rgb(var(--ok))]"
                    />
                    <label htmlFor={c.id} className="min-w-0 flex-1 cursor-pointer">
                      <span className={c.done ? 'text-muted line-through' : 'font-medium'}>{c.label}</span>
                      {c.detail && <span className="block text-[12.5px] text-muted">{c.detail}</span>}
                    </label>
                    {!readOnly && c.category === 'custom' && (
                      <IconButton label={`Remove ${c.label}`} onClick={() => onRemove?.(c.id)}>
                        <Trash2 className="h-4 w-4" />
                      </IconButton>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      <aside className="space-y-4">
        <div className="card p-5">
          <div className="eyebrow mb-1">Progress</div>
          <div className="font-display text-[28px] font-bold tabular">
            {done} of {trip.checklist.length}
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-sunken">
            <div className="h-full rounded-full bg-ok transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
        {!readOnly && (
          <form
            className="card space-y-3 p-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (text.trim()) {
                onAdd?.(text.trim());
                setText('');
              }
            }}
          >
            <label htmlFor="new-check" className="label">
              Add your own item
            </label>
            <input id="new-check" className="input" placeholder="e.g. Book the Dudhsagar jeep" value={text} onChange={(e) => setText(e.target.value)} />
            <Button type="submit" variant="secondary" icon={<Plus className="h-4 w-4" />} className="w-full">
              Add item
            </Button>
            <button type="button" onClick={onReset} className="flex w-full items-center justify-center gap-1.5 text-[12.5px] text-muted hover:text-ink">
              <RotateCcw className="h-3.5 w-3.5" /> Rebuild the list from the plan
            </button>
          </form>
        )}
      </aside>
    </div>
  );
}
