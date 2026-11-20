import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle';
type Size = 'xs' | 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-[background-color,color,box-shadow,border-color,transform] duration-150 ease-out-soft active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap select-none';
const variants: Record<Variant, string> = {
  primary: 'bg-brand text-brand-ink hover:bg-brand/90 shadow-[0_1px_2px_rgb(var(--shadow)/0.12),inset_0_1px_0_rgb(255_255_255/0.12)]',
  secondary: 'bg-surface text-ink border border-line-strong hover:bg-sunken shadow-card',
  ghost: 'text-ink-2 hover:bg-sunken hover:text-ink',
  subtle: 'bg-brand-soft text-brand hover:bg-brand/15',
  danger: 'bg-bad text-white hover:bg-bad/90',
};
const sizes: Record<Size, string> = {
  xs: 'h-7 px-2 text-[12.5px]',
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-9 px-3.5 text-[13.5px]',
  lg: 'h-11 px-5 text-[15px]',
};

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', extra?: string) {
  return clsx(base, variants[variant], sizes[size], extra);
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', size = 'md', icon, className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={buttonClass(variant, size, className)} {...rest}>
      {icon}
      {children}
    </button>
  );
});

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  icon,
  className,
  children,
  ...rest
}: LinkProps & { variant?: Variant; size?: Size; icon?: ReactNode }) {
  return (
    <Link className={buttonClass(variant, size, className)} {...rest}>
      {icon}
      {children}
    </Link>
  );
}

export function IconButton({
  label,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={clsx(
        'inline-grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-sunken hover:text-ink disabled:pointer-events-none disabled:opacity-40',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
