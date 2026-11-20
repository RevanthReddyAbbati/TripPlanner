import { useMemo, useState } from 'react';
import { ArrowRight, CalendarCheck, MapPin } from 'lucide-react';
import type { Interest } from '../types';
import { DESTINATIONS } from '../data/destinations';
import { Page, PageHeader } from '../components/layout/AppShell';
import { ButtonLink } from '../components/ui/Button';
import { Badge, Chip } from '../components/ui/Fields';
import { INTERESTS, INTEREST_LABEL } from '../components/options';
import { plural } from '../lib/format';

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
      <PageHeader eyebrow="Explore" title="Destinations">
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
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((d) => {
            const top = [...d.places].sort((a, b) => b.priority - a.priority).slice(0, 4);
            const good = d.bestMonths.includes(thisMonth);
            return (
              <li key={d.id} className="card flex flex-col p-5">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-[18px] font-semibold">{d.name}</h2>
                    <div className="flex items-center gap-1 text-[12.5px] text-muted">
                      <MapPin className="h-3.5 w-3.5" /> {d.state}
                    </div>
                  </div>
                  {good && (
                    <Badge tone="ok">
                      <CalendarCheck className="h-3 w-3" /> In season
                    </Badge>
                  )}
                </div>
                <p className="text-[14px] text-muted">{d.summary}</p>
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
                    {plural(d.places.length, 'place')} · Best {d.bestMonths.map((m) => MONTHS[m - 1]).slice(0, 3).join(', ')}
                    {d.bestMonths.length > 3 ? '…' : ''}
                  </span>
                  <ButtonLink to={`/app/new?dest=${d.id}`} size="sm" variant="secondary">
                    Plan <ArrowRight className="h-3.5 w-3.5" />
                  </ButtonLink>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Page>
  );
}
