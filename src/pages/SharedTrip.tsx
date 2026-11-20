import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Save } from 'lucide-react';
import type { Trip } from '../types';
import { decodeTrip } from '../lib/share';
import { useTrips } from '../store/trips';
import { Logo } from '../components/layout/Logo';
import { ThemeToggle } from '../components/layout/ThemeToggle';
import { TripWorkspace } from '../components/trip/TripWorkspace';
import { Button, ButtonLink } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';

/** Read-only view of a trip carried in the link, with an option to save a copy. */
export default function SharedTrip() {
  const [params] = useSearchParams();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [error, setError] = useState('');
  const importTrip = useTrips((s) => s.importTrip);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const d = params.get('d');
    if (!d) {
      setError('This link has no trip in it.');
      return;
    }
    decodeTrip(d)
      .then(setTrip)
      .catch(() => setError('This link is damaged or incomplete. Ask for it to be shared again.'));
  }, [params]);

  return (
    <div className="min-h-full">
      <header className="sticky z-[1000] border-b border-line bg-surface/95 backdrop-blur" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {trip && (
              <Button
                icon={<Save className="h-4 w-4" />}
                onClick={() => {
                  const id = importTrip(trip);
                  toast('Saved to your trips. You can edit your copy now.');
                  navigate(`/app/trips/${id}`);
                }}
              >
                Save a copy
              </Button>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
        {error ? (
          <div className="card mx-auto max-w-md p-8 text-center">
            <h1 className="text-[22px] font-bold">Can't open this trip</h1>
            <p className="mt-2 text-muted">{error}</p>
            <ButtonLink to="/app/new" className="mt-5">
              Plan your own trip
            </ButtonLink>
          </div>
        ) : !trip ? (
          <div className="grid h-64 place-items-center">
            <Spinner />
          </div>
        ) : (
          <>
            <div className="mb-5">
              <div className="eyebrow mb-1">Shared trip · view only</div>
              <h1 className="text-[28px] font-bold">{trip.input.name}</h1>
            </div>
            <TripWorkspace trip={trip} readOnly />
          </>
        )}
      </main>
    </div>
  );
}
