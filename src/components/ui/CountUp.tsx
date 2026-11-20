import { useCountUp } from '../../lib/motion';

/** A number that tweens to its new value. Screen readers get the final value straight away. */
export function CountUp({ value, format = (n) => Math.round(n).toLocaleString('en-IN'), duration }: { value: number; format?: (n: number) => string; duration?: number }) {
  const shown = useCountUp(value, { duration });
  return (
    <>
      <span aria-hidden="true">{format(shown)}</span>
      <span className="sr-only">{format(value)}</span>
    </>
  );
}
