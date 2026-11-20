import { useEffect, useMemo, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Crosshair, LocateFixed, MapPinPlus, Maximize2, X } from 'lucide-react';
import clsx from 'clsx';
import type { GeoPoint, Stop, Trip } from '../../types';
import { fetchRoute, reverseGeocode, type SearchResult } from '../../services/geo';
import { fmtTime, fmtDay } from '../../lib/time';
import { inr } from '../../lib/format';
import { directionsTo, mapsLink } from '../../lib/share';
import { centroid } from '../../lib/geo';
import { dayColor } from './colors';
import { PlaceSearch } from '../PlaceSearch';

export interface MapAddRequest extends GeoPoint {
  name: string;
}

interface Props {
  trip: Trip;
  /** Day index, or 'all'. */
  day: number | 'all';
  activeStopId?: string;
  onSelectStop?: (dayIndex: number, stopId: string) => void;
  /** When set, the map offers "add to day" on search results and dropped pins. */
  onAddPlace?: (req: MapAddRequest) => void;
  className?: string;
}

interface Pin {
  stop: Stop;
  dayIndex: number;
  n: number;
}

const MAPPABLE: Stop['kind'][] = ['visit', 'custom', 'checkin'];

export default function TripMap({ trip, day, activeStopId, onSelectStop, onAddPlace, className }: Props) {
  const [draft, setDraft] = useState<MapAddRequest | null>(null);
  const [dropMode, setDropMode] = useState(false);
  const [me, setMe] = useState<GeoPoint | null>(null);
  const [locError, setLocError] = useState('');
  const [fitKey, setFitKey] = useState(0);

  const pins = useMemo<Pin[]>(() => {
    const out: Pin[] = [];
    trip.days.forEach((d) => {
      if (day !== 'all' && d.index !== day) return;
      let n = 0;
      d.stops.forEach((s) => {
        if (s.lat == null || s.lon == null || !MAPPABLE.includes(s.kind)) return;
        if (s.kind === 'checkin' && /home/i.test(s.title)) return;
        out.push({ stop: s, dayIndex: d.index, n: s.kind === 'checkin' ? 0 : ++n });
      });
    });
    return out;
  }, [trip, day]);

  const center = useMemo(() => centroid(trip.input.destinations.length ? trip.input.destinations : [trip.input.origin]), [trip]);
  const dayLabel = day === 'all' ? 'the selected day' : `Day ${day + 1}`;

  return (
    <div className={clsx('relative isolate overflow-hidden rounded-xl border border-line', className)}>
      <MapContainer center={[center.lat, center.lon]} zoom={9} scrollWheelZoom className={clsx('h-full w-full', dropMode && 'cursor-crosshair')} zoomControl={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <ZoomControl />
        <FitTo pins={pins} trip={trip} day={day} fitKey={fitKey} />
        <FocusStop pins={pins} activeStopId={activeStopId} />
        <Legs trip={trip} day={day} />
        <DayRoutes trip={trip} day={day} pins={pins} />
        {pins.map((p) => (
          <StopMarker key={p.stop.id} pin={p} active={p.stop.id === activeStopId} onSelect={onSelectStop} date={trip.days[p.dayIndex].date} />
        ))}
        {me && <CircleMarker center={[me.lat, me.lon]} radius={8} pathOptions={{ color: '#fff', weight: 3, fillColor: '#2563eb', fillOpacity: 1 }} />}
        {draft && (
          <Marker position={[draft.lat, draft.lon]} icon={draftIcon} eventHandlers={{ add: (e) => (e.target as L.Marker).openPopup() }}>
            <Popup eventHandlers={{ remove: () => setDraft(null) }}>
              <DraftForm
                draft={draft}
                dayLabel={dayLabel}
                canAdd={!!onAddPlace && day !== 'all'}
                onAdd={(name) => {
                  onAddPlace?.({ ...draft, name });
                  setDraft(null);
                }}
              />
            </Popup>
          </Marker>
        )}
        <ClickCatcher
          active={dropMode}
          onPick={async (p) => {
            setDropMode(false);
            setDraft({ ...p, name: 'Dropped pin' });
            const name = await reverseGeocode(p);
            if (name) setDraft((d) => (d && d.lat === p.lat && d.lon === p.lon ? { ...d, name } : d));
          }}
        />
        <FlyTo target={draft} />
        <FlyTo target={me} zoom={13} />
      </MapContainer>

      {/* Overlay controls */}
      <div className="pointer-events-none absolute inset-x-3 top-3 z-[500] flex flex-wrap items-start gap-2">
        <div className="pointer-events-auto w-full max-w-xs flex-1 shadow-pop">
          <PlaceSearch
            placeholder="Search places on the map"
            near={center}
            onSelect={(r: SearchResult) => setDraft({ lat: r.lat, lon: r.lon, name: r.name })}
          />
        </div>
      </div>
      <div className="absolute right-3 top-16 z-[500] flex flex-col gap-1.5 sm:top-3">
        <MapBtn label="Fit the route" onClick={() => setFitKey((k) => k + 1)}>
          <Maximize2 className="h-4 w-4" />
        </MapBtn>
        <MapBtn
          label="Show my location"
          onClick={() => {
            setLocError('');
            if (!navigator.geolocation) return setLocError('Location is not available in this browser.');
            navigator.geolocation.getCurrentPosition(
              (pos) => setMe({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
              () => setLocError('Location permission was denied.'),
              { enableHighAccuracy: true, timeout: 10000 },
            );
          }}
        >
          <LocateFixed className="h-4 w-4" />
        </MapBtn>
        {onAddPlace && (
          <MapBtn label={dropMode ? 'Cancel adding a pin' : 'Drop a pin to add a place'} active={dropMode} onClick={() => setDropMode((v) => !v)}>
            {dropMode ? <X className="h-4 w-4" /> : <MapPinPlus className="h-4 w-4" />}
          </MapBtn>
        )}
      </div>
      {dropMode && (
        <div className="absolute bottom-3 left-1/2 z-[500] flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-4 py-2 text-[13px] text-bg shadow-pop">
          <Crosshair className="h-4 w-4" /> Click the map to drop a pin
        </div>
      )}
      {locError && <div className="absolute bottom-3 left-3 z-[500] rounded-lg bg-surface px-3 py-2 text-[13px] text-bad shadow-pop">{locError}</div>}
    </div>
  );
}

function MapBtn({ label, onClick, children, active }: { label: string; onClick: () => void; children: ReactNode; active?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={clsx('grid h-9 w-9 place-items-center rounded-lg border shadow-pop', active ? 'border-brand bg-brand text-brand-ink' : 'border-line bg-surface text-ink hover:bg-sunken')}
    >
      {children}
    </button>
  );
}

function ZoomControl() {
  const map = useMap();
  useEffect(() => {
    const c = L.control.zoom({ position: 'bottomright' });
    c.addTo(map);
    // Leaflet measures its container once; re-measure when the layout changes (tab switches, resizes).
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(map.getContainer());
    return () => {
      c.remove();
      ro.disconnect();
    };
  }, [map]);
  return null;
}

function FitTo({ pins, trip, day, fitKey }: { pins: Pin[]; trip: Trip; day: number | 'all'; fitKey: number }) {
  const map = useMap();
  useEffect(() => {
    let pts: [number, number][] = pins.map((p) => [p.stop.lat!, p.stop.lon!]);
    if (day === 'all' || pts.length < 2) {
      const extra = day === 'all' ? trip.input.destinations : trip.input.destinations.filter((d) => d.id === trip.days[day as number]?.baseId);
      pts = pts.concat(extra.map((d) => [d.lat, d.lon] as [number, number]));
    }
    if (!pts.length) return;
    if (pts.length === 1) map.setView(pts[0], 12);
    else map.fitBounds(L.latLngBounds(pts), { padding: [50, 50], maxZoom: 14 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, trip.id, fitKey]);
  return null;
}

function FocusStop({ pins, activeStopId }: { pins: Pin[]; activeStopId?: string }) {
  const map = useMap();
  useEffect(() => {
    const p = pins.find((x) => x.stop.id === activeStopId);
    if (p) map.flyTo([p.stop.lat!, p.stop.lon!], Math.max(map.getZoom(), 13), { duration: 0.6 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStopId]);
  return null;
}

function FlyTo({ target, zoom = 14 }: { target: GeoPoint | null; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lon], Math.max(map.getZoom(), zoom), { duration: 0.6 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.lat, target?.lon]);
  return null;
}

function ClickCatcher({ active, onPick }: { active: boolean; onPick: (p: GeoPoint) => void }) {
  useMapEvents({
    click(e) {
      if (active) onPick({ lat: e.latlng.lat, lon: e.latlng.lng });
    },
  });
  return null;
}

/** Intercity journeys, drawn as dashed lines. */
function Legs({ trip, day }: { trip: Trip; day: number | 'all' }) {
  return (
    <>
      {trip.legs.map((l) => {
        const legDay = Math.min(trip.days.length - 1, Math.floor(l.departAbs / 1440));
        const arriveDay = Math.min(trip.days.length - 1, Math.floor((l.departAbs + l.durationMin) / 1440));
        if (day !== 'all' && day !== legDay && day !== arriveDay) return null;
        return (
          <Polyline
            key={l.id}
            positions={[
              [l.from.lat, l.from.lon],
              [l.to.lat, l.to.lon],
            ]}
            pathOptions={{ color: dayColor(legDay), weight: 3, dashArray: '2 8', lineCap: 'round', opacity: 0.85 }}
          />
        );
      })}
    </>
  );
}

/** Road routes between a day's stops. Uses OSRM for the selected day; straight lines in the all-days view. */
function DayRoutes({ trip, day, pins }: { trip: Trip; day: number | 'all'; pins: Pin[] }) {
  const [route, setRoute] = useState<[number, number][] | null>(null);
  const reqRef = useRef(0);

  useEffect(() => {
    setRoute(null);
    if (day === 'all') return;
    const pts = pins.filter((p) => p.dayIndex === day).map((p) => ({ lat: p.stop.lat!, lon: p.stop.lon! }));
    if (pts.length < 2) return;
    const id = ++reqRef.current;
    const ctrl = new AbortController();
    fetchRoute(pts.slice(0, 25), ctrl.signal).then((r) => {
      if (r && id === reqRef.current) setRoute(r.coords);
    });
    return () => ctrl.abort();
  }, [day, pins]);

  if (day !== 'all') {
    const pts = pins.map((p) => [p.stop.lat!, p.stop.lon!] as [number, number]);
    if (pts.length < 2) return null;
    return route ? (
      <DrawnPolyline key={`r-${day}-${route.length}`} positions={route} pathOptions={{ color: dayColor(day), weight: 5, opacity: 0.85 }} />
    ) : (
      <Polyline positions={pts} pathOptions={{ color: dayColor(day), weight: 3, opacity: 0.6 }} />
    );
  }
  return (
    <>
      {trip.days.map((d) => {
        const pts = pins.filter((p) => p.dayIndex === d.index).map((p) => [p.stop.lat!, p.stop.lon!] as [number, number]);
        if (pts.length < 2) return null;
        return <Polyline key={d.index} positions={pts} pathOptions={{ color: dayColor(d.index), weight: 3, opacity: 0.75 }} />;
      })}
    </>
  );
}

/** A polyline that draws itself once when it appears, then behaves like a normal path (zoom-safe). */
function DrawnPolyline(props: ComponentProps<typeof Polyline>) {
  const ref = useRef<L.Polyline>(null);
  useEffect(() => {
    const el = ref.current?.getElement() as SVGPathElement | undefined;
    if (!el || typeof el.getTotalLength !== 'function' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const len = Math.ceil(el.getTotalLength());
    el.style.setProperty('--len', String(len));
    el.classList.add('route-draw');
    const done = () => {
      el.classList.remove('route-draw');
      el.style.removeProperty('--len');
    };
    el.addEventListener('animationend', done, { once: true });
    return () => el.removeEventListener('animationend', done);
  }, []);
  return <Polyline ref={ref} {...props} />;
}

const iconCache = new Map<string, L.DivIcon>();
function pinIcon(n: number, color: string, active: boolean, kind: Stop['kind']): L.DivIcon {
  const key = `${n}-${color}-${active}-${kind}`;
  let ic = iconCache.get(key);
  if (!ic) {
    const size = active ? 32 : 26;
    const label = kind === 'checkin' ? '⌂' : String(n);
    ic = L.divIcon({
      className: '',
      html: `<div class="pin${active ? ' active' : ''}" style="width:${size}px;height:${size}px;background:${color}">${label}</div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2],
    });
    iconCache.set(key, ic);
  }
  return ic;
}

const draftIcon = L.divIcon({
  className: '',
  html: '<div class="pin" style="width:30px;height:30px;background:#111;font-size:16px">+</div>',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
});

function StopMarker({ pin, active, onSelect, date }: { pin: Pin; active: boolean; onSelect?: Props['onSelectStop']; date: string }) {
  const { stop, dayIndex, n } = pin;
  return (
    <Marker
      position={[stop.lat!, stop.lon!]}
      icon={pinIcon(n, dayColor(dayIndex), active, stop.kind)}
      zIndexOffset={active ? 1000 : 0}
      eventHandlers={{ click: () => onSelect?.(dayIndex, stop.id) }}
      title={stop.title}
    >
      <Popup>
        <div className="min-w-[200px]">
          <div className="mb-0.5 font-mono text-[11px] uppercase tracking-wider" style={{ color: dayColor(dayIndex) }}>
            Day {dayIndex + 1} · {fmtDay(date)} · {fmtTime(stop.start)}
          </div>
          <div className="text-[14px] font-semibold">{stop.title}</div>
          {stop.note && <div className="mt-1 text-muted">{stop.note}</div>}
          {stop.cost > 0 && <div className="mt-1 font-mono text-[12px]">{inr(stop.cost)} per person</div>}
          <div className="mt-2 flex gap-3">
            <a href={mapsLink(stop.lat!, stop.lon!, stop.title)} target="_blank" rel="noopener noreferrer">
              Google Maps ↗
            </a>
            <a href={directionsTo(stop.lat!, stop.lon!)} target="_blank" rel="noopener noreferrer">
              Directions ↗
            </a>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

function DraftForm({ draft, dayLabel, canAdd, onAdd }: { draft: MapAddRequest; dayLabel: string; canAdd: boolean; onAdd: (name: string) => void }) {
  const [name, setName] = useState(draft.name);
  useEffect(() => setName(draft.name), [draft.name]);
  return (
    <form
      className="min-w-[220px] space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim()) onAdd(name.trim());
      }}
    >
      <label className="block text-[12px] font-medium text-muted" htmlFor="draft-name">
        Place name
      </label>
      <input id="draft-name" className="input" value={name} onChange={(e) => setName(e.target.value)} />
      {canAdd ? (
        <button type="submit" className="w-full rounded-lg bg-brand px-3 py-2 text-[13px] font-medium text-brand-ink">
          Add to {dayLabel}
        </button>
      ) : (
        <p className="text-[12px] text-muted">Pick a single day above the itinerary to add this place to it.</p>
      )}
      <a className="block text-[12px]" href={mapsLink(draft.lat, draft.lon, name)} target="_blank" rel="noopener noreferrer">
        Open in Google Maps ↗
      </a>
    </form>
  );
}
