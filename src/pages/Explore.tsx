import { useMemo, useState } from 'react';
import { ArrowRight, CalendarCheck, MapPin } from 'lucide-react';
import type { Interest } from '../types';
import { DESTINATIONS } from '../data/destinations';
import { Page, PageHeader } from '../components/layout/AppShell';
import { ButtonLink } from '../components/ui/Button';
import { Badge, Chip } from '../components/ui/Fields';
import { INTERESTS, INTEREST_LABEL } from '../components/options';
import { plural } from '../lib/format';
import { dayColor } from '../components/map/colors';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Explore() {
  const [tag, setTag] = useState<Interest | null>(null);
  const [q, setQ] = useState('');
  const thisMonth = new Date().getMonth() + 1;
  const [inSeason, setInSeason] = useState(false);

  const list = useMemo(
    () =>
      DESTINATIONS.filter((d) => (!tag || d.tags.includes(tag)) && (!inSeason || d.bestMonths.includes(thisMonth)) && (!q || `${d.name} ${d.state}`.toLowerCase().includes(q.toLowerCase()))),
    [tag, q, inSeason, thisMonth],
  );

  return (
    <Page>
      <PageHeader title="Explore destinations" crumbs={[{ label: 'Workspace' }, { label: 'Explore' }]}>
        Curated places with real coordinates, opening hours and entry fees. Plan a trip from any of them, or search any town when you plan.
      </PageHeader>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <input className="input max-w-xs" placeholder="Search by name or state" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search destinations" />
        <Chip on={inSeason} onClick={() => setInSeason((v) => !v)}>
          Good in {MONTHS[thisMonth - 1]}
        </Chip>
        <Chip on={!tag} onClick={() => setTag(null)}>
          All
        </Chip>
        {INTERESTS.map((i) => (
          <Chip key={i.value} on={tag === i.value} onClick={() => setTag(tag === i.value ? null : i.value)}>
            {i.label}
          </Chip>
        ))}
      </div>
      {list.length === 0 ? (
        <p className="card p-8 text-center text-muted">No destinations match these filters.</p>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((d, idx) => {
            const top = [...d.places].sort((a, b) => b.priority - a.priority).slice(0, 4);
            const good = d.bestMonths.includes(thisMonth);
            const c = dayColor(idx);
            return (
              <li key={d.id} className="card flex flex-col overflow-hidden">
                <div className="relative h-24 overflow-hidden" style={{ background: `linear-gradient(135deg, ${c}, ${c}aa 60%, ${c}55)` }}>
                  <svg className="absolute inset-0 h-full w-full opacity-25" aria-hidden="true">
                    <defs>
                      <pattern id={`p-${d.id}`} width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
                        <path d="M0 11h22" stroke="#fff" strokeWidth="1" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill={`url(#p-${d.id})`} />
                  </svg>
                  <div className="absolute bottom-3 left-5 right-5 flex items-end justify-between gap-2 text-white">
                    <div>
                      <h2 className="text-[19px] font-semibold drop-shadow-sm">{d.name}</h2>
                      <div className="flex items-center gap-1 text-[12.5px] opacity-90">
                        <MapPin className="h-3.5 w-3.5" /> {d.state}
                      </div>
                    </div>
                    {good && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-white/90 px-1.5 py-0.5 text-[11.5px] font-semibold text-ok">
                        <CalendarCheck className="h-3 w-3" /> In season
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-5">
                <p className="text-[13.5px] text-muted">{d.summary}</p>
                <div className="mt-3 flex gap-0.5" aria-label="Best months">
                  {MONTHS.map((m, i) => (
                    <span key={m} title={m} className="flex-1">
                      <span className={`block h-1.5 rounded-full ${d.bestMonths.includes(i + 1) ? 'bg-ok' : 'bg-sunken'} ${i + 1 === thisMonth ? 'ring-1 ring-ink/40' : ''}`} />
                      <span className="mt-1 block text-center text-[9.5px] text-muted">{m[0]}</span>
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {d.tags.map((t) => (
                    <Badge key={t}>{INTEREST_LABEL[t]}</Badge>
                  ))}
                </div>
                <ul className="mt-4 space-y-1 text-[13.5px]">
                  {top.map((p) => (
                    <li key={p.id} className="truncate">
                      · {p.name}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex items-center justify-between pt-5">
                  <span className="text-[12.5px] text-muted">
                    {plural(d.places.length, 'place')}
                  </span>
                  <ButtonLink to={`/app/new?dest=${d.id}`} size="sm" variant="secondary">
                    Plan <ArrowRight className="h-3.5 w-3.5" />
                  </ButtonLink>
                </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Page>
  );
}
