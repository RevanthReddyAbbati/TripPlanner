// Small, dependency-free SVG charts. Colors for marks are passed in; text uses theme tokens.
import { useState, type ReactNode } from 'react';
import { inr } from '../../lib/format';

export interface Slice {
  key: string;
  label: string;
  value: number;
  color: string;
}

/** Donut with a center label. Slices under 0.5% are drawn as a hairline so they stay visible. */
export function Donut({ slices, size = 168, thickness = 22, center }: { slices: Slice[]; size?: number; thickness?: number; center?: ReactNode }) {
  const total = slices.reduce((a, s) => a + s.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label="Share by category">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--sunken))" strokeWidth={thickness} />
        {total > 0 &&
          slices
            .filter((s) => s.value > 0)
            .map((s) => {
              const len = Math.max((s.value / total) * c, 1.5);
              const el = (
                <circle
                  key={s.key}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={thickness}
                  strokeDasharray={`${Math.max(0, len - 1.5)} ${c}`}
                  strokeDashoffset={-offset}
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                >
                  <title>
                    {s.label}: {inr(s.value)} ({Math.round((s.value / total) * 100)}%)
                  </title>
                </circle>
              );
              offset += len;
              return el;
            })}
      </svg>
      {center && <div className="absolute inset-0 grid place-items-center text-center">{center}</div>}
    </div>
  );
}

export interface BarDatum {
  label: string;
  sub?: string;
  value: number;
  /** Optional comparison (e.g. planned), drawn as a tick. */
  target?: number;
  highlight?: boolean;
}

/** Vertical bars with an optional target tick per bar. */
export function BarChart({ data, height = 200, color = 'rgb(var(--brand))', targetLabel = 'Plan', valueLabel = 'Spent' }: { data: BarDatum[]; height?: number; color?: string; targetLabel?: string; valueLabel?: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = Math.max(320, data.length * 64);
  const padL = 44;
  const padB = 34;
  const padT = 10;
  const innerH = height - padB - padT;
  const max = niceMax(Math.max(1, ...data.map((d) => Math.max(d.value, d.target ?? 0))));
  const ticks = [0, max / 2, max];
  const bw = Math.min(36, ((W - padL) / data.length) * 0.5);
  const x = (i: number) => padL + ((W - padL) / data.length) * (i + 0.5);
  const y = (v: number) => padT + innerH - (v / max) * innerH;
  return (
    <div className="relative w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${height}`} className="h-auto w-full min-w-[320px]" role="img" aria-label={`${valueLabel} by day`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={W} y1={y(t)} y2={y(t)} stroke="rgb(var(--line))" strokeDasharray={t ? '3 4' : undefined} />
            <text x={padL - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="rgb(var(--muted))">
              {short(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const over = d.target != null && d.value > d.target;
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={x(i) - ((W - padL) / data.length) / 2} y={padT} width={(W - padL) / data.length} height={innerH} fill={hover === i ? 'rgb(var(--sunken))' : 'transparent'} />
              <rect
                x={x(i) - bw / 2}
                y={y(d.value)}
                width={bw}
                height={Math.max(0, innerH - (y(d.value) - padT))}
                rx={4}
                fill={over ? 'rgb(var(--bad))' : color}
                opacity={d.highlight === false ? 0.45 : 1}
              />
              {d.target != null && d.target > 0 && (
                <line x1={x(i) - bw / 2 - 5} x2={x(i) + bw / 2 + 5} y1={y(d.target)} y2={y(d.target)} stroke="rgb(var(--ink))" strokeWidth={2} strokeLinecap="round" opacity={0.7} />
              )}
              <text x={x(i)} y={height - 18} textAnchor="middle" fontSize="11.5" fill="rgb(var(--ink-2))" fontWeight={d.highlight ? 600 : 400}>
                {d.label}
              </text>
              {d.sub && (
                <text x={x(i)} y={height - 5} textAnchor="middle" fontSize="10.5" fill="rgb(var(--muted))">
                  {d.sub}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {hover != null && (
        <div className="pointer-events-none absolute top-1 rounded-lg border border-line bg-raised px-3 py-2 text-[12.5px] shadow-pop" style={{ left: `min(calc(${(x(hover) / W) * 100}% - 60px), calc(100% - 150px))` }}>
          <div className="font-semibold">
            {data[hover].label} {data[hover].sub && <span className="font-normal text-muted">· {data[hover].sub}</span>}
          </div>
          <div className="tabular">
            {valueLabel}: {inr(data[hover].value)}
          </div>
          {data[hover].target != null && (
            <div className="tabular text-muted">
              {targetLabel}: {inr(data[hover].target!)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Running total of actual spend against the planned running total and the cap. */
export function CumulativeChart({ planned, actual, cap, labels, height = 200, todayIndex }: { planned: number[]; actual: (number | null)[]; cap: number; labels: string[]; height?: number; todayIndex?: number }) {
  const W = 560;
  const padL = 48;
  const padR = 12;
  const padB = 26;
  const padT = 12;
  const n = labels.length;
  const cumP = cumsum(planned);
  const cumA: (number | null)[] = [];
  let run = 0;
  actual.forEach((v) => {
    if (v == null) cumA.push(null);
    else {
      run += v;
      cumA.push(run);
    }
  });
  const max = niceMax(Math.max(cap, ...cumP, ...(cumA.filter((v) => v != null) as number[])) * 1.05);
  const x = (i: number) => padL + (n <= 1 ? 0 : (i / (n - 1)) * (W - padL - padR));
  const y = (v: number) => padT + (height - padT - padB) * (1 - v / max);
  const line = (vals: (number | null)[]) =>
    vals
      .map((v, i) => (v == null ? null : `${x(i)},${y(v)}`))
      .filter(Boolean)
      .join(' ');
  const lastA = cumA.reduce<number>((acc, v, i) => (v != null ? i : acc), -1);
  const area = lastA >= 0 ? `${x(0)},${y(0)} ${line(cumA.slice(0, lastA + 1))} ${x(lastA)},${y(0)}` : '';
  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="h-auto w-full" role="img" aria-label="Cumulative spend against plan">
      {[0, max / 2, max].map((t) => (
        <g key={t}>
          <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="rgb(var(--line))" strokeDasharray={t ? '3 4' : undefined} />
          <text x={padL - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="rgb(var(--muted))">
            {short(t)}
          </text>
        </g>
      ))}
      <line x1={padL} x2={W - padR} y1={y(cap)} y2={y(cap)} stroke="rgb(var(--bad))" strokeDasharray="6 4" strokeWidth={1.5} />
      <text x={W - padR} y={y(cap) - 5} textAnchor="end" fontSize="11" fill="rgb(var(--bad))" fontWeight={600}>
        Cap {short(cap)}
      </text>
      {todayIndex != null && todayIndex >= 0 && todayIndex < n && (
        <line x1={x(todayIndex)} x2={x(todayIndex)} y1={padT} y2={height - padB} stroke="rgb(var(--muted))" strokeDasharray="2 3" />
      )}
      <polyline points={line(cumP)} fill="none" stroke="rgb(var(--muted))" strokeWidth={2} strokeDasharray="5 4" />
      {area && <polygon points={area} fill="rgb(var(--brand) / 0.12)" />}
      <polyline points={line(cumA)} fill="none" stroke="rgb(var(--brand))" strokeWidth={2.5} strokeLinejoin="round" />
      {cumA.map((v, i) => v != null && i === lastA && <circle key={i} cx={x(i)} cy={y(v)} r={4} fill="rgb(var(--brand))" stroke="rgb(var(--surface))" strokeWidth={2} />)}
      {labels.map((l, i) => (
        <text key={i} x={x(i)} y={height - 8} textAnchor="middle" fontSize="11" fill="rgb(var(--muted))">
          {l}
        </text>
      ))}
    </svg>
  );
}

export function Legend({ items }: { items: { label: string; color: string; dashed?: boolean }[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <svg width="16" height="6" aria-hidden="true">
            <line x1="0" x2="16" y1="3" y2="3" stroke={i.color} strokeWidth={i.dashed ? 2 : 3} strokeDasharray={i.dashed ? '4 3' : undefined} />
          </svg>
          {i.label}
        </span>
      ))}
    </div>
  );
}

function cumsum(a: number[]): number[] {
  let s = 0;
  return a.map((v) => (s += v));
}

function niceMax(v: number): number {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return step * p;
}

function short(v: number): string {
  if (v >= 100000) return `₹${(v / 100000).toFixed(v % 100000 ? 1 : 0)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(v % 1000 ? 1 : 0)}k`;
  return `₹${Math.round(v)}`;
}
