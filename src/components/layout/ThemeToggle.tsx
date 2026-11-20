import { Monitor, Moon, Sun } from 'lucide-react';
import clsx from 'clsx';
import { useSettings, type Theme } from '../../store/settings';
import { withViewTransition } from '../../lib/motion';

const NEXT: Record<Theme, Theme> = { system: 'light', light: 'dark', dark: 'system' };
const LABEL: Record<Theme, string> = { system: 'Theme: system', light: 'Theme: light', dark: 'Theme: dark' };

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSettings((s) => s.theme);
  const setTheme = useSettings((s) => s.setTheme);
  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;
  return (
    <button
      type="button"
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        // The new theme grows out of the button as a circle (where View Transitions are supported).
        withViewTransition(() => setTheme(NEXT[theme]), { x: r.left + r.width / 2, y: r.top + r.height / 2 });
      }}
      aria-label={LABEL[theme]}
      title={LABEL[theme]}
      className={clsx('inline-grid h-9 w-9 place-items-center rounded-lg text-muted transition-colors hover:bg-sunken hover:text-ink', className)}
    >
      <Icon key={theme} className="animate-in h-[18px] w-[18px]" />
    </button>
  );
}
