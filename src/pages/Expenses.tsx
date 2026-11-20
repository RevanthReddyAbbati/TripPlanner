// All expenses across every trip, with filters, totals and CSV export.
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Plus, ReceiptIndianRupee, Search } from 'lucide-react';
import type { ExpenseCategory, Trip } from '../types';
import { useAllTrips, useTrips } from '../store/trips';
import { CATEGORIES, CATEGORY, tripPhase } from '../engine/expenses';
import { Page } from '../components/layout/AppShell';
import { Avatar, EmptyState, PageHeader, Stat, StatGrid } from '../components/ui/Kit';
import { Button, ButtonLink } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { ExpenseModal } from '../components/expenses/ExpenseModal';
import { CategoryIcon, METHOD_LABEL } from '../components/expenses/CategoryIcon';
import { downloadFile } from '../lib/share';
import { inr } from '../lib/format';
import { toISODate } from '../lib/time';

export default function Expenses() {
  const trips = useAllTrips();
  const toast = useToast();
  const [tripFilter, setTripFilter] = useState('all');
  const [cat, setCat] = useState<'all' | ExpenseCategory>('all');
  const [q, setQ] = useState('');
  const [choosing, setChoosing] = useState(false);
  const [chosenId, setChosenId] = useState('');
  const [addFor, setAddFor] = useState<Trip | null>(null);

  const rows = useMemo(
    () =>
      trips
        .flatMap((t) => t.expenses.map((e) => ({ e, t })))
        .sort((a, b) => (b.e.date + (b.e.time ?? '')).localeCompare(a.e.date + (a.e.time ?? ''))),
    [trips],
  );

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    return rows.filter(
      ({ e, t }) =>
        (tripFilter === 'all' || t.id === tripFilter) &&
        (cat === 'all' || e.category === cat) &&
        (!text || `${e.title} ${e.note ?? ''} ${t.input.name}`.toLowerCase().includes(text)),
    );
  }, [rows, tripFilter, cat, q]);

  const total = rows.reduce((a, r) => a + r.e.amount, 0);
  const month = toISODate(new Date()).slice(0, 7);
  const thisMonth = rows.filter((r) => r.e.date.startsWith(month)).reduce((a, r) => a + r.e.amount, 0);
  const tripsWith = new Set(rows.map((r) => r.t.id)).size;
  const filteredTotal = filtered.reduce((a, r) => a + r.e.amount, 0);
  const live = trips.find((t) => tripPhase(t).kind === 'live');

  const startAdd = () => {
    if (live) setAddFor(live);
    else if (trips.length === 1) setAddFor(trips[0]);
    else {
      setChosenId(trips[0]?.id ?? '');
      setChoosing(true);
    }
  };

  const exportCsv = () => {
    const esc = (v: string | number) => {
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [['Date', 'Time', 'Trip', 'Title', 'Category', 'Amount (INR)', 'Paid by', 'Split ways', 'Method', 'Note']];
    filtered.forEach(({ e, t }) =>
      lines.push([
        e.date, e.time ?? '', t.input.name, e.title, CATEGORY[e.category].label, String(e.amount),
        t.travelers.find((p) => p.id === e.paidBy)?.name ?? '', String(e.splitWith.length), METHOD_LABEL[e.method], e.note ?? '',
      ]),
    );
    downloadFile(`itinera-expenses-${toISODate(new Date())}.csv`, lines.map((r) => r.map(esc).join(',')).join('\n'), 'text/csv');
  };

  return (
    <Page wide>
      <PageHeader
        crumbs={[{ label: 'Home', to: '/app/home' }, { label: 'Expenses' }]}
        title="Expenses"
        actions={
          trips.length > 0 && (
            <>
              <Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={exportCsv} disabled={!filtered.length}>
                Export CSV
              </Button>
              <Button icon={<Plus className="h-4 w-4" />} onClick={startAdd}>
                Add expense
              </Button>
            </>
          )
        }
      >
        Every expense logged across your trips.
      </PageHeader>

      {trips.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<ReceiptIndianRupee className="h-5 w-5" />}
            title="No trips yet"
            action={<ButtonLink to="/app/new" icon={<Plus className="h-4 w-4" />}>Plan a trip</ButtonLink>}
          >
            Plan a trip first. Then log expenses as you travel and see them all here.
          </EmptyState>
        </div>
      ) : (
        <div className="space-y-6">
          <StatGrid cols={4}>
            <Stat label="Total spent" value={inr(total)} sub={`${rows.length} expense${rows.length === 1 ? '' : 's'}`} />
            <Stat label="This month" value={inr(thisMonth)} sub={new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} />
            <Stat label="Trips with expenses" value={String(tripsWith)} sub={`of ${trips.length} trip${trips.length === 1 ? '' : 's'}`} />
            <Stat label="Average per trip" value={inr(tripsWith ? total / tripsWith : 0)} sub="Across trips with expenses" />
          </StatGrid>

          <section className="card min-w-0 overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-3">
              <div className="relative min-w-[180px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input className="input pl-9" placeholder="Search expenses or trips" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search expenses" />
              </div>
              <select className="input w-auto max-w-[220px]" value={tripFilter} onChange={(e) => setTripFilter(e.target.value)} aria-label="Filter by trip">
                <option value="all">All trips</option>
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.input.name}
                  </option>
                ))}
              </select>
              <select className="input w-auto" value={cat} onChange={(e) => setCat(e.target.value as 'all' | ExpenseCategory)} aria-label="Filter by category">
                <option value="all">All categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {rows.length === 0 ? (
              <EmptyState
                icon={<ReceiptIndianRupee className="h-5 w-5" />}
                title="No expenses logged yet"
                action={<Button icon={<Plus className="h-4 w-4" />} onClick={startAdd}>Add expense</Button>}
              >
                Add what you spend during a trip to track it against the budget and split it with your group.
              </EmptyState>
            ) : filtered.length === 0 ? (
              <p className="px-5 py-10 text-center text-[13.5px] text-muted">No expenses match these filters.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table-base min-w-[860px]">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Expense</th>
                      <th>Category</th>
                      <th>Trip</th>
                      <th>Paid by</th>
                      <th>Method</th>
                      <th className="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(({ e, t }) => {
                      const payer = t.travelers.find((p) => p.id === e.paidBy) ?? { name: 'Unknown', color: '#64748b' };
                      return (
                        <tr key={`${t.id}-${e.id}`} className="hover:bg-sunken/50">
                          <td className="whitespace-nowrap tabular text-ink-2">
                            {new Date(e.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {e.time && <span className="ml-1.5 text-[12px] text-muted">{e.time}</span>}
                          </td>
                          <td className="max-w-[280px]">
                            <div className="flex items-center gap-2.5">
                              <CategoryIcon category={e.category} size={28} />
                              <div className="min-w-0">
                                <div className="truncate font-medium">{e.title}</div>
                                {e.note && <div className="truncate text-[12px] text-muted">{e.note}</div>}
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap text-ink-2">{CATEGORY[e.category].label}</td>
                          <td className="max-w-[200px]">
                            <Link to={`/app/trips/${t.id}?tab=expenses`} className="block truncate font-medium text-brand hover:underline">
                              {t.input.name}
                            </Link>
                          </td>
                          <td>
                            <span className="flex items-center gap-2 whitespace-nowrap">
                              <Avatar person={payer} size={22} />
                              {payer.name}
                            </span>
                          </td>
                          <td className="text-ink-2">{METHOD_LABEL[e.method]}</td>
                          <td className="whitespace-nowrap text-right font-semibold tabular">{inr(e.amount)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-sunken/60">
                      <td colSpan={6} className="border-t border-line px-4 py-3 font-semibold">
                        {filtered.length} expense{filtered.length === 1 ? '' : 's'}
                      </td>
                      <td className="whitespace-nowrap border-t border-line px-4 py-3 text-right font-semibold tabular">{inr(filteredTotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      <Modal
        open={choosing}
        onClose={() => setChoosing(false)}
        title="Add an expense"
        description="Which trip is it for?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setChoosing(false)}>
              Cancel
            </Button>
            <Button
              disabled={!chosenId}
              onClick={() => {
                const t = trips.find((x) => x.id === chosenId);
                setChoosing(false);
                if (t) setAddFor(t);
              }}
            >
              Continue
            </Button>
          </>
        }
      >
        <label htmlFor="pick-trip" className="label">
          Trip
        </label>
        <select id="pick-trip" className="input" value={chosenId} onChange={(e) => setChosenId(e.target.value)}>
          {trips.map((t) => (
            <option key={t.id} value={t.id}>
              {t.input.name}
            </option>
          ))}
        </select>
      </Modal>

      {addFor && (
        <ExpenseModal
          trip={addFor}
          open
          onClose={() => setAddFor(null)}
          onSave={(e) => {
            useTrips.getState().addExpense(addFor.id, e);
            toast(`Added ${e.title} to ${addFor.input.name}.`);
          }}
        />
      )}
    </Page>
  );
}
