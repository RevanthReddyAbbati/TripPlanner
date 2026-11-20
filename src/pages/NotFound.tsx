import { ButtonLink } from '../components/ui/Button';

export default function NotFound() {
  return (
    <div className="grid min-h-full place-items-center p-6">
      <div className="text-center">
        <div className="eyebrow">404</div>
        <h1 className="mt-1 text-[28px] font-bold">This page doesn't exist</h1>
        <p className="mt-2 text-muted">The link may be old or mistyped.</p>
        <ButtonLink to="/app/trips" className="mt-5">
          Go to your trips
        </ButtonLink>
      </div>
    </div>
  );
}
