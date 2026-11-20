import { useEffect, useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import clsx from 'clsx';
import type { Expense, ExpenseCategory, PaymentMethod, Trip } from '../../types';
import { CATEGORIES } from '../../engine/expenses';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Kit';
import { inr } from '../../lib/format';
import { toISODate } from '../../lib/time';
import { tripEndDate } from '../../engine/expenses';
import { AiReceiptScan } from '../ai/AiReceiptScan';

export type ExpenseDraft = Omit<Expense, 'id' | 'createdAt'>;

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'upi', label: 'UPI' },
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'other', label: 'Other' },
];

/** Default date for a new expense: today during the trip, otherwise the start date. */
export function defaultExpenseDate(trip: Trip): string {
  const today = toISODate(new Date());
  return today >= trip.input.startDate && today <= tripEndDate(trip) ? today : trip.input.startDate;
}

export function newExpenseDraft(trip: Trip, partial: Partial<ExpenseDraft> = {}): ExpenseDraft {
  const now = new Date();
  return {
    title: '',
    amount: 0,
    category: 'food',
    date: defaultExpenseDate(trip),
    time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    paidBy: trip.travelers[0]?.id ?? '',
    splitWith: trip.travelers.map((t) => t.id),
    method: 'upi',
    ...partial,
  };
}

export function ExpenseModal({
  trip, open, initial, editingId, onClose, onSave, onDelete,
}: {
  trip: Trip;
  open: boolean;
  initial?: Partial<ExpenseDraft>;
  editingId?: string;
  onClose: () => void;
  onSave: (e: ExpenseDraft) => void;
  onDelete?: () => void;
}) {
  const [d, setD] = useState<ExpenseDraft>(() => newExpenseDraft(trip, initial));
  const [amountText, setAmountText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      const draft = newExpenseDraft(trip, initial);
      setD(draft);
      setAmountText(draft.amount ? String(draft.amount) : '');
      setError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingId]);

  const set = <K extends keyof ExpenseDraft>(k: K, v: ExpenseDraft[K]) => setD((s) => ({ ...s, [k]: v }));
  const amount = Number(amountText.replace(/[^\d.]/g, '')) || 0;
  const share = d.splitWith.length ? amount / d.splitWith.length : 0;
  const everyone = d.splitWith.length === trip.travelers.length;

  const toggleSplit = (id: string) =>
    set('splitWith', d.splitWith.includes(id) ? d.splitWith.filter((x) => x !== id) : [...d.splitWith, id]);

  const days = useMemo(() => trip.days.map((x) => x.date), [trip.days]);

  const submit = () => {
    if (amount <= 0) return setError('Enter an amount above zero.');
    if (!d.title.trim()) return setError('Add a short description, like "Lunch at Baga".');
    if (!d.splitWith.length) return setError('Pick at least one person to split with.');
    onSave({ ...d, amount: Math.round(amount * 100) / 100, title: d.title.trim() });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingId ? 'Edit expense' : 'Add expense'}
      size="md"
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          {editingId && onDelete ? (
            <Button variant="ghost" className="text-bad hover:text-bad" icon={<Trash2 className="h-4 w-4" />} onClick={() => { onDelete(); onClose(); }}>
              Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={submit}>{editingId ? 'Save changes' : 'Add expense'}</Button>
          </div>
        </div>
      }
    >
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {!editingId && (
          <AiReceiptScan
            onResult={(r) => {
              setAmountText(String(r.amount));
              setD((s) => ({
                ...s,
                title: r.title,
                category: r.category,
                method: r.method ?? s.method,
                date: r.date && days.includes(r.date) ? r.date : s.date,
                note: r.note ?? s.note,
              }));
              setError('');
            }}
          />
        )}

        <div className="grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
          <div>
            <label htmlFor="x-amount" className="label">
              Amount (₹)
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] font-semibold text-muted">₹</span>
              <input
                id="x-amount"
                inputMode="decimal"
                autoFocus
                className="input h-11 pl-8 text-[20px] font-semibold tabular"
                placeholder="0"
                value={amountText}
                onChange={(e) => setAmountText(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label htmlFor="x-title" className="label">
              What was it for?
            </label>
            <input id="x-title" className="input h-11" placeholder="e.g. Dinner at Vagator" value={d.title} onChange={(e) => set('title', e.target.value)} />
          </div>
        </div>

        <div>
          <span className="label">Category</span>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => set('category', c.key as ExpenseCategory)}
                aria-pressed={d.category === c.key}
                className={clsx(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12.5px] font-medium transition-colors',
                  d.category === c.key ? 'border-transparent text-white' : 'border-line-strong bg-surface text-ink-2 hover:bg-sunken',
                )}
                style={d.category === c.key ? { background: c.color } : undefined}
              >
                {d.category !== c.key && <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />}
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="x-date" className="label">
              Date
            </label>
            <select id="x-date" className="input" value={d.date} onChange={(e) => set('date', e.target.value)}>
              {!days.includes(d.date) && <option value={d.date}>{d.date}</option>}
              {trip.days.map((day) => (
                <option key={day.date} value={day.date}>
                  Day {day.index + 1} · {new Date(day.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="x-time" className="label">
              Time
            </label>
            <input id="x-time" type="time" className="input" value={d.time ?? ''} onChange={(e) => set('time', e.target.value)} />
          </div>
          <div>
            <span className="label">Paid with</span>
            <div className="flex h-9 rounded-lg border border-line-strong bg-sunken p-0.5" role="radiogroup" aria-label="Payment method">
              {METHODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  role="radio"
                  aria-checked={d.method === m.value}
                  onClick={() => set('method', m.value)}
                  className={clsx('flex-1 rounded-md text-[12.5px] font-medium', d.method === m.value ? 'bg-surface text-ink shadow-card' : 'text-muted hover:text-ink')}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="x-paid" className="label">
              Paid by
            </label>
            <select id="x-paid" className="input" value={d.paidBy} onChange={(e) => set('paidBy', e.target.value)}>
              {trip.travelers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[13px] font-medium text-ink-2">Split equally with</span>
              <button type="button" className="text-[12.5px] font-medium text-brand hover:underline" onClick={() => set('splitWith', everyone ? [d.paidBy] : trip.travelers.map((t) => t.id))}>
                {everyone ? 'Only payer' : 'Everyone'}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {trip.travelers.map((t) => {
                const on = d.splitWith.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleSplit(t.id)}
                    className={clsx(
                      'inline-flex items-center gap-1.5 rounded-full border py-0.5 pl-0.5 pr-2.5 text-[12.5px] font-medium transition-colors',
                      on ? 'border-brand bg-brand-soft text-ink' : 'border-line-strong text-muted opacity-70 hover:opacity-100',
                    )}
                  >
                    <Avatar person={t} size={22} />
                    {t.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="x-note" className="label">
            Note <span className="font-normal text-muted">(optional)</span>
          </label>
          <input id="x-note" className="input" value={d.note ?? ''} onChange={(e) => set('note', e.target.value || undefined)} />
        </div>

        {amount > 0 && d.splitWith.length > 0 && (
          <div className="rounded-lg bg-sunken px-3.5 py-2.5 text-[13px] text-ink-2">
            {inr(amount)} split {d.splitWith.length} way{d.splitWith.length > 1 ? 's' : ''} = <strong className="tabular">{inr(share)}</strong> each
          </div>
        )}
        {error && <p className="rounded-lg bg-bad-soft px-3 py-2 text-[13px] font-medium text-bad">{error}</p>}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
