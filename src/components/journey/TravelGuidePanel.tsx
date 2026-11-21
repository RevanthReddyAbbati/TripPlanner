import { useMemo, useState } from 'react';
import { BookOpen, ChevronDown, Compass, ShieldCheck } from 'lucide-react';
import clsx from 'clsx';
import type { Trip } from '../../types';
import { buildAllJourneys } from '../../engine/journey';
import { fmtDay, fmtDuration, fmtTime } from '../../lib/time';
import { Card, Stat, StatGrid } from '../ui/Kit';
import { JourneyCard, KindIcon } from './JourneyCard';

const GLOSSARY: [string, string][] = [
  ['PNR', 'The 10-digit number on your train ticket. Use it to check if your seat is confirmed and to find your coach and berth.'],
  ['CNF / RAC / WL', 'CNF means a confirmed berth. RAC means you can travel but share a side berth until one frees up. WL means waitlisted: an e-ticket is cancelled automatically if it is still waitlisted when the chart is made.'],
  ['Tatkal', 'Last-minute train quota, opening one day before travel: 10 AM for AC classes and 11 AM for Sleeper. Fares are higher and tickets sell out in minutes.'],
  ['Berth types', 'Lower (LB), Middle (MB), Upper (UB), Side Lower (SL) and Side Upper (SU). Lower berths are easiest for elders. Upper berths are good for sleeping in the daytime.'],
  ['Sleeper vs AC', 'Sleeper (SL) is non-AC with open windows and is the cheapest. AC 3-tier (3A) comes with bedding and closed windows. AC 2-tier (2A) has fewer berths per bay and curtains.'],
  ['Chart preparation', 'The final seat list is made about 4 hours before departure. RAC and waitlisted statuses change at this point.'],
  ['Boarding point (bus)', 'Private buses pick up at several spots across a city. Choose the one nearest you. The exact spot and bus number come by SMS.'],
  ['m-ticket', 'The ticket on your phone, by SMS or email. Bus staff and train ticket checkers accept it with your photo ID.'],
  ['Prepaid taxi', 'A counter at stations and airports where you pay a fixed fare upfront, so you are not overcharged. Keep the slip and give it to the driver at the end.'],
  ['Last mile', 'The short ride from the station, bus stand or airport to where you are staying.'],
];

/** Every journey of the trip in order, plus a primer for first-time travellers. */
export function TravelGuidePanel({ trip }: { trip: Trip }) {
  const journeys = useMemo(() => buildAllJourneys(trip), [trip]);
  const [openPrimer, setOpenPrimer] = useState(true);
  const withData = journeys.filter((j) => j.hasData).length;
  const totalMin = journeys.reduce((a, j) => a + j.durationMin, 0);
  const totalKm = journeys.reduce((a, j) => a + j.distanceKm, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[18px] font-semibold">Travel guide</h2>
        <p className="text-[13.5px] text-muted">Every journey on this trip, step by step: what to book, where to go, when to board and how to reach your stay.</p>
      </div>

      <StatGrid cols={4}>
        <Stat label="Journeys" value={journeys.length} sub={`${withData} with checked train or bus details`} />
        <Stat label="Time travelling" value={fmtDuration(totalMin)} sub="Door to door, estimated" />
        <Stat label="Distance" value={`${totalKm.toLocaleString('en-IN')} km`} sub="By road or rail" />
        <Stat label="Overnight journeys" value={journeys.filter((j) => j.overnight).length} sub="Saves hotel nights" />
      </StatGrid>

      <section className="card overflow-hidden">
        <button
          type="button"
          onClick={() => setOpenPrimer((v) => !v)}
          aria-expanded={openPrimer}
          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
        >
          <span className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-ok-soft text-ok">
              <BookOpen className="h-[18px] w-[18px]" />
            </span>
            <span>
              <span className="block text-[15px] font-semibold">New to travelling? Start here</span>
              <span className="block text-[12.5px] text-muted">Words you'll see on tickets and at stations, explained simply.</span>
            </span>
          </span>
          <ChevronDown className={clsx('h-5 w-5 text-muted transition-transform', openPrimer && 'rotate-180')} />
        </button>
        {openPrimer && (
          <div className="border-t border-line px-5 py-4">
            <dl className="grid gap-x-8 gap-y-3 md:grid-cols-2">
              {GLOSSARY.map(([term, desc]) => (
                <div key={term} className="min-w-0">
                  <dt className="text-[13.5px] font-semibold">{term}</dt>
                  <dd className="text-[13px] leading-relaxed text-ink-2">{desc}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 flex items-start gap-2 rounded-lg bg-sunken px-3 py-2.5 text-[12.5px] text-ink-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ok" />
              Helplines: Emergency 112 · Railway help and security 139 · Women's helpline 181. Share your live location with someone at home on long journeys.
            </p>
          </div>
        )}
      </section>

      {journeys.length > 1 && (
        <Card title="Your journeys at a glance" bodyClass="p-0">
          <ol className="divide-y divide-line">
            {journeys.map((j, i) => (
              <li key={j.legId}>
                <a href={`#journey-${j.legId}`} className="flex items-center gap-3 px-5 py-3 hover:bg-sunken/60">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sunken text-[12px] font-semibold text-ink-2">{i + 1}</span>
                  <KindIcon kind={j.kind} className="h-4 w-4 shrink-0 text-muted" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-medium">{j.title}</span>
                    <span className="block truncate text-[12px] text-muted">
                      {fmtDay(j.date)} · leave {fmtTime(j.departMin, false)} · {j.options[0]?.number ? `${j.options[0].number} ${j.options[0].name}` : j.modeLabel}
                    </span>
                  </span>
                  <span className="hidden text-[12.5px] text-muted sm:block">{fmtDuration(j.durationMin)}</span>
                </a>
              </li>
            ))}
          </ol>
        </Card>
      )}

      <div className="space-y-6">
        {journeys.map((j, i) => (
          <div key={j.legId} id={`journey-${j.legId}`} className="scroll-mt-20">
            <JourneyCard plan={j} index={i} />
          </div>
        ))}
      </div>

      {journeys.length === 0 && (
        <Card>
          <p className="flex items-center gap-2 text-[13.5px] text-muted">
            <Compass className="h-4 w-4" /> Add a destination to see how to get there.
          </p>
        </Card>
      )}
    </div>
  );
}
