import { useMemo, useState } from 'react';
import { BedDouble, BusFront, Check, Copy, MoreHorizontal, Pencil, Plus, Sparkles, Ticket, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import type { Booking, BookingStatus, BookingType, Trip } from '../../types';
import type { WorkspaceActions } from './TripWorkspace';
import { Card, EmptyState, Stat, StatGrid } from '../ui/Kit';
import { Button, IconButton } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { inr, plural } from '../../lib/format';
import { fmtDay } from '../../lib/time';
import { BOOKING_CATEGORY, bookingSuggestions } from '../bookings/suggest';
import { BookingModal, BOOKING_STATUSES, BOOKING_TYPES, type BookingSaveResult } from '../bookings/BookingModal';

const TYPE_ICON: Record<BookingType, typeof Ticket> = { transport: BusFront, stay: BedDouble, activity: Ticket, other: MoreHorizontal };
const TYPE_LABEL: Record<BookingType, string> = { transport: 'Transport', stay: 'Stays', activity: 'Activities', other: 'Other' };

export function BookingsPanel({ trip, readOnly, actions }: { trip: Trip; readOnly?: boolean; actions?: WorkspaceActions }) {
  const editable = !readOnly && !!actions;
  const toast = useToast();
  const [modal, setModal] = useState<{ open: boolean; editing?: Booking; initial?: Partial<Booking> }>({ open: false });
  const suggestions = useMemo(() => bookingSuggestions(trip), [trip]);

  const active = trip.bookings.filter((b) => b.status !== 'cancelled');
  const confirmed = trip.bookings.filter((b) => b.status === 'confirmed').length;
  const pending = trip.bookings.filter((b) => b.status === 'pending').length;
  const committed = active.reduce((a, b) => a + b.amount, 0);

  const groups = BOOKING_TYPES.map((t) => ({
    type: t.value,
    items: trip.bookings.filter((b) => b.type === t.value).sort((a, b) => (a.date + (a.time ?? '')).localeCompare(b.date + (b.time ?? ''))),
  })).filter((g) => g.items.length);

  const save = ({ booking, logExpensePaidBy }: BookingSaveResult) => {
    if (!actions) return;
    let id = modal.editing?.id;
    if (id) actions.updateBooking(id, booking);
    else id = actions.addBooking(booking);
    if (logExpensePaidBy && booking.amount > 0) {
      const expenseId = actions.addExpense({
        title: booking.title,
        amount: booking.amount,
        category: BOOKING_CATEGORY[booking.type],
        date: booking.date,
        time: booking.time,
        paidBy: logExpensePaidBy,
        splitWith: trip.travelers.map((t) => t.id),
        method: 'upi',
        bookingId: id,
        note: booking.reference ? `Ref ${booking.reference}` : undefined,
      });
      actions.updateBooking(id, { expenseId });
      toast(`Saved ${booking.title} and logged ${inr(booking.amount)} as an expense.`);
    } else {
      toast(modal.editing ? 'Booking updated.' : `Added ${booking.title}.`);
    }
  };

  const setStatus = (b: Booking, status: BookingStatus) => {
    actions?.updateBooking(b.id, { status });
    if (status === 'confirmed' && !b.expenseId && b.amount > 0) {
      toast('Confirmed. Edit the booking to log it as an expense.');
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast('Reference copied.');
    } catch {
      toast('Copy is blocked here. Select the reference and copy it manually.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-semibold">Bookings</h2>
          <p className="text-[13.5px] text-muted">Tickets, stays and activities with their references and status.</p>
        </div>
        {editable && (
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setModal({ open: true })}>
            Add booking
          </Button>
        )}
      </div>

      <StatGrid cols={4}>
        <Stat label="Bookings" value={trip.bookings.length} sub={suggestions.length ? `${plural(suggestions.length, 'item')} still to book` : 'Everything in the plan is covered'} />
        <Stat label="Confirmed" value={confirmed} tone="ok" sub={active.length ? `${Math.round((confirmed / active.length) * 100)}% of active bookings` : 'None yet'} />
        <Stat label="Pending" value={pending} tone={pending ? 'warn' : undefined} sub={pending ? 'Waiting on confirmation' : 'Nothing waiting'} />
        <Stat label="Committed" value={inr(committed)} sub={`${inr(Math.round(committed / trip.input.travelers))} per person`} />
      </StatGrid>

      {editable && suggestions.length > 0 && (
        <Card
          title={
            <span className="inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" /> Suggested from your plan
            </span>
          }
          subtitle="Journeys and stays in the itinerary without a booking yet"
          bodyClass="p-0"
        >
          <ul className="divide-y divide-line">
            {suggestions.map((s) => {
              const Icon = TYPE_ICON[s.type];
              return (
                <li key={s.key} className="flex items-center gap-3 px-5 py-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-sunken text-muted">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-medium">{s.title}</div>
                    <div className="truncate text-[12px] text-muted">{s.detail}</div>
                  </div>
                  <div className="hidden text-right sm:block">
                    <div className="text-[13px] font-semibold tabular">{inr(s.estimate)}</div>
                    <div className="text-[11.5px] text-muted">estimate</div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<Plus className="h-3.5 w-3.5" />}
                    onClick={() => {
                      actions!.addBooking(s.draft);
                      toast(`Added ${s.title} as pending.`);
                    }}
                  >
                    Add
                  </Button>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {groups.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Ticket className="h-5 w-5" />}
            title="No bookings yet"
            action={
              editable && (
                <Button icon={<Plus className="h-4 w-4" />} onClick={() => setModal({ open: true })}>
                  Add booking
                </Button>
              )
            }
          >
            {editable ? 'Add tickets and hotel confirmations, or start from the suggestions above.' : 'Nothing has been booked for this trip.'}
          </EmptyState>
        </div>
      ) : (
        groups.map((g) => {
          const Icon = TYPE_ICON[g.type];
          const total = g.items.filter((b) => b.status !== 'cancelled').reduce((a, b) => a + b.amount, 0);
          return (
            <Card
              key={g.type}
              title={
                <span className="inline-flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted" /> {TYPE_LABEL[g.type]}
                </span>
              }
              actions={<span className="text-[12.5px] text-muted tabular">{inr(total)}</span>}
              bodyClass="p-0"
            >
              <ul className="divide-y divide-line">
                {g.items.map((b) => (
                  <li key={b.id} className={clsx('flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3', b.status === 'cancelled' && 'opacity-60')}>
                    <div className="min-w-0 flex-1 basis-56">
                      <div className={clsx('truncate text-[13.5px] font-medium', b.status === 'cancelled' && 'line-through')}>{b.title}</div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-muted">
                        <span>
                          {fmtDay(b.date)}
                          {b.time ? ` · ${b.time}` : ''}
                          {b.endDate ? ` → ${fmtDay(b.endDate)}` : ''}
                        </span>
                        {b.provider && <span>· {b.provider}</span>}
                        {b.expenseId && (
                          <span className="inline-flex items-center gap-0.5 text-ok">
                            · <Check className="h-3 w-3" /> logged
                          </span>
                        )}
                      </div>
                    </div>
                    {b.reference && (
                      <button
                        type="button"
                        onClick={() => copy(b.reference!)}
                        className="inline-flex max-w-[180px] items-center gap-1.5 rounded-md border border-line bg-sunken px-2 py-1 font-mono text-[12px] text-ink-2 hover:border-line-strong"
                        title="Copy reference"
                      >
                        <span className="truncate">{b.reference}</span>
                        <Copy className="h-3 w-3 shrink-0 text-muted" />
                      </button>
                    )}
                    <span className="w-24 text-right text-[13.5px] font-semibold tabular">{b.amount ? inr(b.amount) : '—'}</span>
                    {editable ? (
                      <select
                        aria-label={`Status of ${b.title}`}
                        value={b.status}
                        onChange={(e) => setStatus(b, e.target.value as BookingStatus)}
                        className={clsx(
                          'h-7 rounded-full border-0 px-2.5 text-[12px] font-semibold focus:ring-2 focus:ring-brand/20',
                          b.status === 'confirmed' && 'bg-ok-soft text-ok',
                          b.status === 'pending' && 'bg-warn-soft text-warn',
                          b.status === 'cancelled' && 'bg-sunken text-muted',
                        )}
                      >
                        {BOOKING_STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <StatusPill status={b.status} />
                    )}
                    {editable && (
                      <div className="flex">
                        <IconButton label={`Edit ${b.title}`} onClick={() => setModal({ open: true, editing: b, initial: b })}>
                          <Pencil className="h-4 w-4" />
                        </IconButton>
                        <IconButton
                          label={`Delete ${b.title}`}
                          onClick={() => {
                            actions!.removeBooking(b.id);
                            toast('Booking deleted.');
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </IconButton>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          );
        })
      )}

      {editable && (
        <BookingModal
          trip={trip}
          open={modal.open}
          editingId={modal.editing?.id}
          initial={modal.initial}
          onClose={() => setModal({ open: false })}
          onSave={save}
          onDelete={modal.editing ? () => actions!.removeBooking(modal.editing!.id) : undefined}
        />
      )}
    </div>
  );
}

function StatusPill({ status }: { status: BookingStatus }) {
  return (
    <span
      className={clsx(
        'inline-flex h-6 items-center rounded-full px-2.5 text-[12px] font-semibold',
        status === 'confirmed' && 'bg-ok-soft text-ok',
        status === 'pending' && 'bg-warn-soft text-warn',
        status === 'cancelled' && 'bg-sunken text-muted',
      )}
    >
      {BOOKING_STATUSES.find((s) => s.value === status)?.label}
    </span>
  );
}
