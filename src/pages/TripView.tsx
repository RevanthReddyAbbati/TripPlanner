import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CalendarDays, CalendarPlus, ChevronRight, Copy, FileJson, Link2, MoreHorizontal, Plus, Printer, Route, Trash2 } from 'lucide-react';
import type { Trip, TripStatus } from '../types';
import { AvatarStack } from '../components/ui/Kit';
import { Badge } from '../components/ui/Fields';
import { tripEndDate, tripPhase } from '../engine/expenses';
import { fmtDate } from '../lib/time';
import { useTrip, useTrips } from '../store/trips';
import { Page } from '../components/layout/AppShell';
import { TripWorkspace } from '../components/trip/TripWorkspace';
import { Button, ButtonLink } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { encodeTrip, exportICS, exportJSON, shareUrl } from '../lib/share';
import { STATUS_OPTIONS } from '../components/trip/status';

function PhaseBadge({ trip }: { trip: Trip }) {
  const p = tripPhase(trip);
  if (p.kind === 'live') return <Badge tone="ok">● Live · Day {p.dayIndex + 1} of {trip.days.length}</Badge>;
  if (p.kind === 'upcoming') return <Badge tone="brand">Starts in {p.daysToGo} day{p.daysToGo === 1 ? '' : 's'}</Badge>;
  return <Badge>Completed</Badge>;
}

export default function TripView() {
  const { id } = useParams();
  const trip = useTrip(id);
  const s = useTrips();
  const navigate = useNavigate();
  const toast = useToast();
  const [menu, setMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [, setParams] = useSearchParams();

  if (!trip || !id) {
    return (
      <Page>
        <div className="card mx-auto max-w-md p-8 text-center">
          <h1 className="text-[22px] font-bold">Trip not found</h1>
          <p className="mt-2 text-muted">It may have been deleted, or it was saved in a different browser.</p>
          <ButtonLink to="/app/trips" className="mt-5">
            Back to trips
          </ButtonLink>
        </div>
      </Page>
    );
  }

  const share = async () => {
    const url = shareUrl(await encodeTrip(trip));
    setShareLink(url);
    try {
      await navigator.clipboard.writeText(url);
      toast('Share link copied.');
    } catch {
      /* the modal shows the link for manual copy */
    }
  };

  return (
    <Page wide>
      <nav aria-label="Breadcrumb" className="no-print mb-2 flex items-center gap-1 text-[12.5px] text-muted">
        <Link to="/app/trips" className="hover:text-ink">
          Trips
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="truncate text-ink-2">{trip.input.name}</span>
      </nav>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-[min(100%,26rem)] flex-1">
          <input
            aria-label="Trip name"
            className="-ml-1.5 w-full rounded-md bg-transparent px-1.5 text-[24px] font-semibold leading-tight tracking-tight outline-none ring-brand/30 hover:bg-sunken focus:bg-surface focus:ring-2 sm:text-[26px]"
            defaultValue={trip.input.name}
            key={trip.id}
            onBlur={(e) => e.target.value.trim() && e.target.value !== trip.input.name && s.rename(id, e.target.value.trim())}
          />
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-muted">
            <PhaseBadge trip={trip} />
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" /> {fmtDate(trip.input.startDate)} – {fmtDate(tripEndDate(trip))}
            </span>
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <Route className="h-4 w-4 shrink-0" />
              <span className="truncate">{[trip.input.origin.name, ...trip.input.destinations.map((d) => d.name)].join(' → ')}</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <AvatarStack people={trip.travelers} size={22} />
              {trip.travelers.length} travellers
            </span>
          </div>
        </div>
        <div className="no-print flex flex-wrap items-center gap-2">
          <select
            aria-label="Trip status"
            className="input w-auto"
            value={trip.status}
            onChange={(e) => s.setStatus(id, e.target.value as TripStatus)}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <Button variant="secondary" icon={<Link2 className="h-4 w-4" />} onClick={share}>
            Share
          </Button>
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setParams({ tab: 'expenses', add: '1' }, { replace: true })}>
            Add expense
          </Button>
          <div className="relative">
            <Button variant="secondary" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)} icon={<MoreHorizontal className="h-4 w-4" />}>
              More
            </Button>
            {menu && (
              <>
                <div className="fixed inset-0 z-[1000]" onClick={() => setMenu(false)} />
                <div role="menu" className="absolute right-0 z-[1001] mt-1 w-56 overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-pop">
                  <MenuItem icon={<CalendarPlus className="h-4 w-4" />} onClick={() => { exportICS(trip); setMenu(false); }}>
                    Add to calendar (.ics)
                  </MenuItem>
                  <MenuItem icon={<FileJson className="h-4 w-4" />} onClick={() => { exportJSON(trip); setMenu(false); }}>
                    Export as JSON
                  </MenuItem>
                  <MenuItem icon={<Printer className="h-4 w-4" />} onClick={() => { setMenu(false); setTimeout(() => window.print(), 50); }}>
                    Print or save as PDF
                  </MenuItem>
                  <MenuItem
                    icon={<Copy className="h-4 w-4" />}
                    onClick={() => {
                      const newId = s.duplicate(id);
                      setMenu(false);
                      if (newId) {
                        toast('Trip duplicated.');
                        navigate(`/app/trips/${newId}`);
                      }
                    }}
                  >
                    Duplicate
                  </MenuItem>
                  <div className="my-1 border-t border-line" />
                  <MenuItem danger icon={<Trash2 className="h-4 w-4" />} onClick={() => { setConfirmDelete(true); setMenu(false); }}>
                    Delete trip
                  </MenuItem>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <TripWorkspace
        key={trip.id}
        trip={trip}
        actions={{
          setDay: (d) => s.setDay(id, d),
          setDays: (days) => s.setDays(id, days),
          addPlace: (destId, p) => s.addPlace(id, destId, p),
          toggleCheck: (cid) => s.toggleCheck(id, cid),
          addCheck: (label) => s.addCheck(id, label),
          removeCheck: (cid) => s.removeCheck(id, cid),
          resetChecklist: () => s.resetChecklist(id),
          regenerate: (patch) => s.regenerate(id, patch),
          updateInput: (patch) => s.updateInput(id, patch),
          setNotes: (n) => s.setNotes(id, n),
          updateTraveler: (tid, patch) => s.updateTraveler(id, tid, patch),
          addExpense: (e) => s.addExpense(id, e),
          updateExpense: (eid, patch) => s.updateExpense(id, eid, patch),
          removeExpense: (eid) => s.removeExpense(id, eid),
          addBooking: (b) => s.addBooking(id, b),
          updateBooking: (bid, patch) => s.updateBooking(id, bid, patch),
          removeBooking: (bid) => s.removeBooking(id, bid),
        }}
      />

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this trip?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
              Keep it
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                s.remove(id);
                toast('Trip deleted.');
                navigate('/app/trips');
              }}
            >
              Delete trip
            </Button>
          </>
        }
      >
        <p className="text-[14px]">
          <strong>{trip.input.name}</strong> and its itinerary, notes and checklist will be removed from this browser. Export it first if you might need it again.
        </p>
      </Modal>

      <Modal open={!!shareLink} onClose={() => setShareLink('')} title="Share this trip" footer={<Button onClick={() => setShareLink('')}>Done</Button>}>
        <p className="mb-3 text-[14px]">Anyone with this link can view the plan and save their own copy. The whole trip is inside the link, so nothing is uploaded.</p>
        <div className="flex gap-2">
          <input readOnly className="input font-mono text-[12px]" value={shareLink} onFocus={(e) => e.target.select()} aria-label="Share link" />
          <Button
            variant="secondary"
            icon={<Copy className="h-4 w-4" />}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(shareLink);
                toast('Link copied.');
              } catch {
                toast('Select the link and copy it manually.', 'error');
              }
            }}
          >
            Copy
          </Button>
        </div>
      </Modal>
    </Page>
  );
}

function MenuItem({ icon, children, onClick, danger }: { icon: ReactNode; children: ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button role="menuitem" onClick={onClick} className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-[14px] hover:bg-sunken ${danger ? 'text-bad' : ''}`}>
      {icon}
      {children}
    </button>
  );
}
