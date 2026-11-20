import { BedDouble, BusFront, Car, MoreHorizontal, ShoppingBag, Ticket, UtensilsCrossed } from 'lucide-react';
import type { ExpenseCategory, PaymentMethod } from '../../types';
import { CATEGORY } from '../../engine/expenses';

const ICONS: Record<ExpenseCategory, typeof BusFront> = {
  transport: BusFront,
  stay: BedDouble,
  food: UtensilsCrossed,
  local: Car,
  activities: Ticket,
  shopping: ShoppingBag,
  other: MoreHorizontal,
};

/** Rounded tile with the category's icon on a tint of its color. */
export function CategoryIcon({ category, size = 32 }: { category: ExpenseCategory; size?: number }) {
  const Icon = ICONS[category];
  const color = CATEGORY[category].color;
  return (
    <span
      className="inline-grid shrink-0 place-items-center rounded-lg"
      style={{ width: size, height: size, background: `${color}1f`, color }}
      title={CATEGORY[category].label}
    >
      <Icon style={{ width: size * 0.5, height: size * 0.5 }} />
    </span>
  );
}

export const METHOD_LABEL: Record<PaymentMethod, string> = { upi: 'UPI', cash: 'Cash', card: 'Card', other: 'Other' };
