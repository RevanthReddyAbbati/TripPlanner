import { ButtonLink } from '../components/ui/Button';

export default function NotFound() {
  return (
    <div className="grid min-h-full place-items-center p-6">
      <div className="page-enter text-center">
        <svg aria-hidden="true" viewBox="0 0 220 80" className="mx-auto mb-6 h-20 w-56 text-brand">
          <path d="M10 60 C 50 60, 60 20, 100 24 S 150 64, 170 40" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="2 7" strokeLinecap="round" />
          <circle cx="10" cy="60" r="6" fill="currentColor" />
          <path d="M184 26 l14 14 M198 26 l-14 14" stroke="rgb(var(--muted))" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <div className="font-mono text-[12px] text-muted">404</div>
        <h1 className="mt-1 text-[28px] font-semibold">This route goes nowhere</h1>
        <p className="mt-2 text-muted">The link may be old or mistyped.</p>
        <div className="mt-6 flex justify-center gap-2">
          <ButtonLink to="/app/trips">Go to your trips</ButtonLink>
          <ButtonLink to="/" variant="secondary">
            Home page
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
