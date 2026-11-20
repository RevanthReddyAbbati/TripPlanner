import { Sparkles } from 'lucide-react';
import { ButtonLink } from '../ui/Button';
import clsx from 'clsx';

/** Shown in place of an AI feature until Gemini is connected in Settings. */
export function AIConnectHint({ compact, className, what = 'this' }: { compact?: boolean; className?: string; what?: string }) {
  if (compact) {
    return (
      <p className={clsx('flex flex-wrap items-center gap-1.5 text-[12.5px] text-muted', className)}>
        <Sparkles className="h-3.5 w-3.5 text-accent" />
        Connect Gemini to use {what}.
        <ButtonLink to="/app/settings#ai" size="xs" variant="ghost" className="text-brand">
          Set up AI
        </ButtonLink>
      </p>
    );
  }
  return (
    <div className={clsx('flex flex-col items-center rounded-xl border border-dashed border-line-strong px-6 py-10 text-center', className)}>
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-warn-soft text-accent">
        <Sparkles className="h-5 w-5" />
      </span>
      <h3 className="mt-3 text-[15px] font-semibold">Connect Gemini to use {what}</h3>
      <p className="mt-1 max-w-[46ch] text-[13.5px] text-muted">
        Add your own Gemini API key (kept only in this browser) or a proxy URL in Settings. It takes about a minute.
      </p>
      <ButtonLink to="/app/settings#ai" className="mt-4" icon={<Sparkles className="h-4 w-4" />}>
        Set up AI
      </ButtonLink>
    </div>
  );
}

export function AIBadge({ className }: { className?: string }) {
  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-md bg-warn-soft px-1.5 py-0.5 text-[11px] font-semibold text-accent ring-1 ring-inset ring-accent/25', className)}>
      <Sparkles className="h-3 w-3" /> AI
    </span>
  );
}
