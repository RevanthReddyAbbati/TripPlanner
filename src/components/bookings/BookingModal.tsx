import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import clsx from 'clsx';
import type { Booking, BookingStatus, BookingType, Trip } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export type BookingDraft = Omit<Booking, 'id'>;

export interface BookingSaveResult {
  booking: BookingDraft;
  /** When set, also log an expense paid by this traveller. */
  logExpensePaidBy?: string;
}

export const BOOKING_TYPES: { value: BookingType; label: string }[] = [
  { value: 'transport', label: 'Transport' },
  { value: 'stay', label: 'Stay' },
  { value: 'activity', label: 'Activity' },
  { value: 'other', label: 'Other' },
];

export const BOOKING_STATUSES: { value: BookingStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function BookingModal({
  trip, open, initial, editingId, onClose, onSave, onDelete,
}: {
  trip: Trip;
  open: boolean;
  initial?: Partial<BookingDraft>;
  editingId?: string;
  onClose: () => void;
  onSave: (r: BookingSaveResult) => void;
  onDelete?: () => void;
}) {
  const blank = (): BookingDraft => ({ type: 'transport', title: '', date: trip.input.startDate, amount: 0, status: 'pending', ...initial });
  const [d, setD] = useState<BookingDraft>(blank);
  const [amountText, setAmountText] = useState('');
  const [logExpense, setLogExpense] = useState(false);
  const [logTouched, setLogTouched] = useState(false);
  const [payer, setPayer] = useState(trip.travelers[0]?.id ?? '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    const b = blank();
    setD(b);
    setAmountText(b.amount ? String(b.amount) : '');
    setLogExpense(false);
    setLogTouched(false);
    setPayer(trip.travelers[0]?.id ?? '');
    setError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingId]);

  const amount = Number(amountText.replace(/[^\d.]/g, '')) || 0;
  const canLog = !d.expenseId && d.status === 'confirmed' && amount > 0;
  // Default the checkbox on when the booking becomes confirmed with an amount, unless the user changed it.
  useEffect(() => {
    if (!logTouched) setLogExpense(canLog);
  }, [canLog, logTouched]);

  const set = <K extends keyof BookingDraft>(k: K, v: BookingDraft[K]) => setD((s) => ({ ...s, [k]: v }));

  const submit = () => {
    if (!d.title.trim()) return setError('Give the booking a title, like "AC sleeper bus to Goa".');
    if (!d.date) return setError('Pick a date.');
    if (d.endDate && d.endDate < d.date) return setError('The end date is before the start date.');
    onSave({
      booking: {
        ...d,
        title: d.title.trim(),
        provider: d.provider?.trim() || undefined,
        reference: d.reference?.trim() || undefined,
        notes: d.notes?.trim() || undefined,
        amount: Math.round(amount),
      },
      logExpensePaidBy: canLog && logExpense ? payer : undefined,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingId ? 'Edit booking' : 'Add booking'}
      description="Keep tickets, hotels and activity bookings in one place."
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
            <Button onClick={submit}>{editingId ? 'Save changes' : 'Add booking'}</Button>
          </div>
        </div>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div>
          <span className="label">Type</span>
          <div className="flex h-9 rounded-lg border border-line-strong bg-sunken p-0.5" role="radiogroup" aria-label="Booking type">
            {BOOKING_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                role="radio"
                aria-checked={d.type === t.value}
                onClick={() => set('type', t.value)}
                className={clsx('flex-1 rounded-md text-[12.5px] font-medium', d.type === t.value ? 'bg-surface text-ink shadow-card' : 'text-muted hover:text-ink')}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label" htmlFor="bk-title">
            Title
          </label>
          <input id="bk-title" autoFocus className="input" placeholder="e.g. AC sleeper bus to Goa" value={d.title} onChange={(e) => set('title', e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="bk-provider">
              Provider
            </label>
            <input id="bk-provider" className="input" placeholder="e.g. redBus, IRCTC, Zostel" value={d.provider ?? ''} onChange={(e) => set('provider', e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="bk-ref">
              Reference / PNR
            </label>
            <input id="bk-ref" className="input font-mono" placeholder="Confirmation number" value={d.reference ?? ''} onChange={(e) => set('reference', e.target.value)} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="bk-date">
              {d.type === 'stay' ? 'Check-in' : 'Date'}
            </label>
            <input id="bk-date" type="date" className="input" value={d.date} onChange={(e) => set('date', e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="bk-time">
              Time
            </label>
            <input id="bk-time" type="time" className="input" value={d.time ?? ''} onChange={(e) => set('time', e.target.value || undefined)} />
          </div>
          <div>
            <label className="label" htmlFor="bk-end">
              {d.type === 'stay' ? 'Check-out' : 'End date'}
            </label>
            <input id="bk-end" type="date" className="input" value={d.endDate ?? ''} onChange={(e) => set('endDate', e.target.value || undefined)} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="bk-amount">
              Amount for the group (₹)
            </label>
            <input id="bk-amount" inputMode="decimal" className="input tabular" placeholder="0" value={amountText} onChange={(e) => setAmountText(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="bk-status">
              Status
            </label>
            <select id="bk-status" className="input" value={d.status} onChange={(e) => set('status', e.target.value as BookingStatus)}>
              {BOOKING_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="bk-notes">
            Notes
          </label>
          <textarea id="bk-notes" className="input min-h-[72px]" value={d.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />
        </div>

        {d.expenseId ? (
          <p className="rounded-lg bg-sunken px-3 py-2 text-[12.5px] text-muted">This booking is already logged as an expense.</p>
        ) : (
          canLog && (
            <div className="rounded-lg border border-line bg-sunken/60 p-3">
              <label className="flex items-center gap-2 text-[13.5px] font-medium">
                <input
                  type="checkbox"
                  id="bk-log"
                  className="h-4 w-4 accent-[rgb(var(--brand))]"
                  checked={logExpense}
                  onChange={(e) => {
                    setLogTouched(true);
                    setLogExpense(e.target.checked);
                  }}
                />
                Also log as an expense, split between everyone
              </label>
              {logExpense && (
                <div className="mt-2.5 flex items-center gap-2 pl-6">
                  <label htmlFor="bk-payer" className="text-[12.5px] text-muted">
                    Paid by
                  </label>
                  <select id="bk-payer" className="input h-8 max-w-[200px]" value={payer} onChange={(e) => setPayer(e.target.value)}>
                    {trip.travelers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )
        )}
        {error && <p className="rounded-lg bg-bad-soft px-3 py-2 text-[13px] font-medium text-bad">{error}</p>}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
