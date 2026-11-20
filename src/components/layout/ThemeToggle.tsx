import { Monitor, Moon, Sun } from 'lucide-react';
import { useSettings, type Theme } from '../../store/settings';

const NEXT: Record<Theme, Theme> = { system: 'light', light: 'dark', dark: 'system' };
const LABEL: Record<Theme, string> = { system: 'Theme: system', light: 'Theme: light', dark: 'Theme: dark' };

export function ThemeToggle() {
  const theme = useSettings((s) => s.theme);
  const setTheme = useSettings((s) => s.setTheme);
  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;
  return (
    <button
      type="button"
      onClick={() => setTheme(NEXT[theme])}
      aria-label={LABEL[theme]}
      title={LABEL[theme]}
      className="inline-grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-sunken hover:text-ink"
    >
      <Icon className="h-[18px] w-[18px]" />
    </button>
  );
}
