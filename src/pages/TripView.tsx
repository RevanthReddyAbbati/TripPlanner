import { useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CalendarPlus, Copy, FileJson, Link2, MoreHorizontal, Printer, Trash2 } from 'lucide-react';
import type { TripStatus } from '../types';
import { useTrip, useTrips } from '../store/trips';
import { Page } from '../components/layout/AppShell';
import { TripWorkspace } from '../components/trip/TripWorkspace';
import { Button, ButtonLink } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { encodeTrip, exportICS, exportJSON, shareUrl } from '../lib/share';
import { STATUS_OPTIONS } from './Dashboard';

export default function TripView() {
  const { id } = useParams();
  const trip = useTrip(id);
  const s = useTrips();
  const navigate = useNavigate();
  const toast = useToast();
  const [menu, setMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [shareLink, setShareLink] = useState('');

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
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-[min(100%,26rem)] flex-1">
          <div className="eyebrow mb-1">{[trip.input.origin.name, ...trip.input.destinations.map((d) => d.name)].join(' → ')}</div>
          <input
            aria-label="Trip name"
            className="w-full rounded-md bg-transparent font-display text-[26px] font-bold leading-tight outline-none ring-brand/30 hover:bg-sunken focus:bg-surface focus:ring-2 sm:text-[30px]"
            defaultValue={trip.input.name}
            key={trip.id}
            onBlur={(e) => e.target.value.trim() && e.target.value !== trip.input.name && s.rename(id, e.target.value.trim())}
          />
        </div>
        <div className="no-print flex flex-wrap items-center gap-2">
          <select
            aria-label="Trip status"
            className="input h-10 w-auto py-0"
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
          addPlace: (destId, p) => s.addPlace(id, destId, p),
          toggleCheck: (cid) => s.toggleCheck(id, cid),
          addCheck: (label) => s.addCheck(id, label),
          removeCheck: (cid) => s.removeCheck(id, cid),
          resetChecklist: () => s.resetChecklist(id),
          regenerate: (patch) => s.regenerate(id, patch),
          updateInput: (patch) => s.updateInput(id, patch),
          setNotes: (n) => s.setNotes(id, n),
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
