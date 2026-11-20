// Motion helpers. One easing curve and a few durations, mirrored in index.css (--ease, --dur-*).
// Everything here respects prefers-reduced-motion and degrades to the final state.
import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

export const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

export function prefersReducedMotion(): boolean {
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(prefersReducedMotion);
  useEffect(() => {
    if (typeof matchMedia === 'undefined') return;
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

/**
 * Reveals children with a short fade and rise when the element scrolls into view.
 * Add the `reveal` class to the element; children with `reveal-item` stagger by `--i`.
 */
export function useReveal<T extends HTMLElement>(options: { once?: boolean; rootMargin?: string } = {}) {
  const ref = useRef<T>(null);
  const { once = true, rootMargin = '0px 0px -10% 0px' } = options;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined' || prefersReducedMotion()) {
      el.dataset.revealed = 'true';
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.dataset.revealed = 'true';
            if (once) io.disconnect();
          } else if (!once) {
            el.dataset.revealed = 'false';
          }
        }),
      { rootMargin, threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once, rootMargin]);
  return ref;
}

/** Tweens a number toward `value` (ease-out) whenever it changes. Starts from 0 on first view. */
export function useCountUp(value: number, { duration = 900, start = true }: { duration?: number; start?: boolean } = {}): number {
  const [shown, setShown] = useState(() => (prefersReducedMotion() ? value : 0));
  const from = useRef(shown);
  useEffect(() => {
    if (!start) return;
    if (prefersReducedMotion() || !Number.isFinite(value)) {
      setShown(value);
      from.current = value;
      return;
    }
    const a = from.current;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = a + (value - a) * eased;
      setShown(v);
      from.current = v;
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, start]);
  return shown;
}

type VTDocument = Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };

/**
 * Runs a DOM-changing update inside a View Transition when the browser supports it.
 * With an origin point, the new state is revealed as a circle growing from that point.
 */
export function withViewTransition(update: () => void, origin?: { x: number; y: number }) {
  const doc = document as VTDocument;
  if (!doc.startViewTransition || prefersReducedMotion()) {
    update();
    return;
  }
  const vt = doc.startViewTransition(() => flushSync(update));
  if (!origin) return;
  const r = Math.hypot(Math.max(origin.x, innerWidth - origin.x), Math.max(origin.y, innerHeight - origin.y));
  vt.ready
    .then(() =>
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${origin.x}px ${origin.y}px)`, `circle(${r}px at ${origin.x}px ${origin.y}px)`] },
        { duration: 480, easing: EASE, pseudoElement: '::view-transition-new(root)' },
      ),
    )
    .catch(() => {
      /* transition skipped */
    });
}
