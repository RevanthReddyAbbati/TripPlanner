import { Link } from 'react-router-dom';
import { BRAND } from '../../config';

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-brand" />
      <path d="M9 22c3-9 11-3 14-12" fill="none" stroke="currentColor" className="text-brand-ink" strokeWidth="2.6" strokeLinecap="round" strokeDasharray="0.1 5" />
      <circle cx="9" cy="22" r="3" className="fill-accent" />
      <circle cx="23" cy="10" r="3" className="fill-brand-ink" />
    </svg>
  );
}

export function Logo({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2.5">
      <LogoMark />
      <span className="font-display text-[19px] font-bold tracking-tight">{BRAND.name}</span>
    </Link>
  );
}
