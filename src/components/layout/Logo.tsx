import { Link } from 'react-router-dom';
import { BRAND } from '../../config';

export function LogoMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-brand" />
      <path d="M9 22c3-9 11-3 14-12" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeDasharray="0.1 5" />
      <circle cx="9" cy="22" r="3" fill="#fbbf24" />
      <circle cx="23" cy="10" r="3" fill="#fff" />
    </svg>
  );
}

export function Logo({ to = '/', compact }: { to?: string; compact?: boolean }) {
  return (
    <Link to={to} className="flex items-center gap-2" aria-label={`${BRAND.name} home`}>
      <LogoMark />
      {!compact && <span className="text-[16px] font-semibold tracking-tight">{BRAND.name}</span>}
    </Link>
  );
}
