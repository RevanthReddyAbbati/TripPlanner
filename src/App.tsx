import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import NewTrip from './pages/NewTrip';
import Explore from './pages/Explore';
import Settings from './pages/Settings';
import SharedTrip from './pages/SharedTrip';
import NotFound from './pages/NotFound';
import { applyTheme, useSettings } from './store/settings';
import { Spinner } from './components/ui/Spinner';

// The trip workspace pulls in Leaflet, so it loads on demand.
const TripView = lazy(() => import('./pages/TripView'));

export default function App() {
  const theme = useSettings((s) => s.theme);
  const { pathname } = useLocation();

  useEffect(() => {
    applyTheme(theme);
    if (theme !== 'system') return;
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const on = () => applyTheme('system');
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [theme]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/shared" element={<SharedTrip />} />
      <Route path="/app" element={<AppShell />}>
        <Route index element={<Navigate to="trips" replace />} />
        <Route path="trips" element={<Dashboard />} />
        <Route path="new" element={<NewTrip />} />
        <Route
          path="trips/:id/*"
          element={
            <Suspense fallback={<div className="grid h-64 place-items-center"><Spinner /></div>}>
              <TripView />
            </Suspense>
          }
        />
        <Route path="explore" element={<Explore />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
