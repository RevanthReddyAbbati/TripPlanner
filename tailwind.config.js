/** @type {import('tailwindcss').Config} */
// Colors come from CSS variables in src/index.css so light and dark themes share one set of class names.
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: v('bg'),
        surface: v('surface'),
        sunken: v('sunken'),
        raised: v('raised'),
        ink: { DEFAULT: v('ink'), 2: v('ink-2') },
        muted: v('muted'),
        line: { DEFAULT: v('line'), strong: v('line-strong') },
        brand: { DEFAULT: v('brand'), ink: v('brand-ink'), soft: v('brand-soft') },
        accent: v('accent'),
        ok: { DEFAULT: v('ok'), soft: v('ok-soft') },
        warn: { DEFAULT: v('warn'), soft: v('warn-soft') },
        bad: { DEFAULT: v('bad'), soft: v('bad-soft') },
      },
      boxShadow: {
        card: '0 1px 2px rgb(var(--shadow) / 0.05)',
        pop: '0 16px 40px -8px rgb(var(--shadow) / 0.22), 0 2px 6px rgb(var(--shadow) / 0.06)',
      },
      minWidth: { 5: '1.25rem' },
      transitionTimingFunction: { 'out-soft': 'cubic-bezier(0.22, 1, 0.36, 1)' },
      fontFamily: {
        display: ['Inter', '"Segoe UI"', 'system-ui', 'sans-serif'],
        sans: ['Inter', '"Segoe UI"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'Consolas', 'monospace'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
