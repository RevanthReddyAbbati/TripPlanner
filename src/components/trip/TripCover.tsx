// Cover band for a trip: one photo per destination (up to three) side by side, with the
// route drawn across them as the product's signature line.
import type { Trip } from '../../types';
import { DestinationPhoto } from '../ui/Photo';
import { dayColor } from '../map/colors';

export function TripCover({ trip }: { trip: Trip }) {
  const dests = trip.input.destinations.slice(0, 3);
  if (!dests.length) return null;
  return (
    <div className="no-print group relative mb-6 h-36 overflow-hidden rounded-2xl border border-line sm:h-48">
      <div className="grid h-full gap-px bg-line" style={{ gridTemplateColumns: `repeat(${dests.length}, minmax(0, 1fr))` }}>
        {dests.map((d, i) => (
          <DestinationPhoto
            key={d.id}
            dest={d}
            color={dayColor(i)}
            priority
            sizes={`${Math.round(100 / dests.length)}vw`}
            className="h-full"
          >
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />
            <span className="absolute bottom-3 left-4 flex items-center gap-2 text-[13px] font-medium text-white">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-[11px] font-semibold tabular text-[#0f172a]">{i + 1}</span>
              <span className="truncate drop-shadow-sm">{d.name}</span>
            </span>
          </DestinationPhoto>
        ))}
      </div>
      {dests.length > 1 && (
        <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 40" preserveAspectRatio="none">
          <path
            d={`M ${100 / dests.length / 2} 30 ${dests
              .slice(1)
              .map((_, i) => {
                const x = (100 / dests.length) * (i + 1.5);
                return `C ${x - 100 / dests.length / 2} ${i % 2 ? 34 : 8}, ${x - 100 / dests.length / 3} ${i % 2 ? 8 : 34}, ${x} 30`;
              })
              .join(' ')}`}
            fill="none"
            stroke="white"
            strokeOpacity="0.85"
            strokeWidth="0.5"
            strokeDasharray="0.3 1.6"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            style={{ strokeWidth: 2.5 }}
          />
        </svg>
      )}
    </div>
  );
}
