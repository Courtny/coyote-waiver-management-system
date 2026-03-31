import type { NormalizedOrder } from './webflow-orders';

export type CustomerLeaderboardRow = {
  email: string;
  name: string;
  orderCount: number;
  totalTickets: number;
  totalSpend: number;
  /** Present when all counted orders used the same currency; otherwise omitted. */
  currency?: string;
};

const DEFAULT_LIMIT = 100;

type Agg = {
  name: string;
  orderIds: Set<string>;
  totalTickets: number;
  totalSpend: number;
  currencies: Set<string>;
};

function pickBetterName(current: string, fullName: string, billing: string): string {
  const f = fullName.trim();
  const b = billing.trim();
  const candidates = [f, b].filter(Boolean);
  if (candidates.length === 0) return current;
  let best = current.trim();
  for (const c of candidates) {
    if (c.length > best.length) best = c;
  }
  return best || '—';
}

/**
 * Rank customers by total Webflow `customerPaid` and sum of line quantities.
 * Deduplicates by `orderId` if the same order appears more than once in `orders`.
 */
export function buildCustomerLeaderboard(
  orders: NormalizedOrder[],
  limit: number = DEFAULT_LIMIT
): CustomerLeaderboardRow[] {
  const seenOrderIds = new Set<string>();
  const byEmail = new Map<string, Agg>();

  for (const order of orders) {
    const email = order.customerEmail?.trim().toLowerCase();
    if (!email) continue;
    if (seenOrderIds.has(order.orderId)) continue;
    seenOrderIds.add(order.orderId);

    let agg = byEmail.get(email);
    if (!agg) {
      agg = {
        name: '—',
        orderIds: new Set(),
        totalTickets: 0,
        totalSpend: 0,
        currencies: new Set(),
      };
      byEmail.set(email, agg);
    }

    agg.orderIds.add(order.orderId);
    agg.totalSpend += order.customerPaidAmount;
    if (order.customerPaidCurrency) {
      agg.currencies.add(order.customerPaidCurrency);
    }
    for (const line of order.lines) {
      agg.totalTickets += line.quantity;
    }
    agg.name = pickBetterName(agg.name, order.customerFullName, order.billingAddressee);
  }

  const rows: CustomerLeaderboardRow[] = Array.from(byEmail.entries()).map(([email, a]) => {
    const currency = a.currencies.size === 1 ? [...a.currencies][0] : undefined;
    return {
      email,
      name: a.name || '—',
      orderCount: a.orderIds.size,
      totalTickets: a.totalTickets,
      totalSpend: a.totalSpend,
      ...(currency ? { currency } : {}),
    };
  });

  rows.sort((x, y) => {
    if (y.totalSpend !== x.totalSpend) return y.totalSpend - x.totalSpend;
    if (y.totalTickets !== x.totalTickets) return y.totalTickets - x.totalTickets;
    if (y.orderCount !== x.orderCount) return y.orderCount - x.orderCount;
    return x.email.localeCompare(y.email);
  });

  return rows.slice(0, Math.max(0, limit));
}
