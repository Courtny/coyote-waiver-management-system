import type { NormalizedOrder, NormalizedLineItem } from './webflow-orders';
import { getCheckinConfig, isCoyoteOpsConfigured } from './checkin-config';

export const COYOTE_OPS_LIST_PAGE_LIMIT = 100;
export const COYOTE_OPS_LIST_MAX_OFFSET = 50_000;

export type CoyoteOpsCheckInLine = {
  sku: string;
  name: string;
  quantity: number;
  faction: string | null;
  productName?: string;
  productId: string | null;
  variantId: string | null;
  imageUrl?: string;
};

export type CoyoteOpsCheckInOrder = {
  code: string;
  status: 'pending' | 'paid' | 'refunded' | 'failed';
  contact: { name: string; email: string };
  lines: CoyoteOpsCheckInLine[];
  paidAt: string | null;
  createdAt?: string | null;
  totalPaidCents?: number;
  source: 'web' | 'webflow_legacy';
};

export type CoyoteOpsOrdersPage = {
  orders: NormalizedOrder[];
  rawCount: number;
  total: number;
};

export class CoyoteOpsOrdersError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.name = 'CoyoteOpsOrdersError';
    this.status = status;
  }
}

export function coyoteOpsLineLabels(line: CoyoteOpsCheckInLine): {
  productName: string;
  displayName: string;
} {
  const productName = (line.productName || '').trim();
  const skuName = (line.name || '').trim();
  if (productName && skuName && skuName !== productName) {
    return { productName, displayName: `${productName} — ${skuName}` };
  }
  const fallback = productName || skuName;
  return { productName: fallback, displayName: fallback };
}

export function normalizeCoyoteOpsOrder(order: CoyoteOpsCheckInOrder): NormalizedOrder {
  const lines: NormalizedLineItem[] = order.lines.map((line) => {
    const labels = coyoteOpsLineLabels(line);
    return {
      productId: line.productId ?? '',
      productName: labels.productName,
      variantId: line.variantId ?? '',
      sku: line.sku,
      displayName: labels.displayName,
      quantity: line.quantity,
      ...(line.imageUrl ? { imageUrl: line.imageUrl } : {}),
    };
  });

  const paidCents =
    typeof order.totalPaidCents === 'number' && Number.isFinite(order.totalPaidCents)
      ? order.totalPaidCents
      : 0;

  return {
    orderId: order.code,
    acceptedOn: order.paidAt ?? order.createdAt ?? null,
    customerEmail: (order.contact.email || '').trim().toLowerCase(),
    customerFullName: order.contact.name || '',
    billingAddressee: order.contact.name || '',
    customerPaidAmount: paidCents / 100,
    customerPaidCurrency: 'USD',
    lines,
  };
}

function parseOrderList(data: unknown): CoyoteOpsCheckInOrder[] {
  if (!data || typeof data !== 'object') return [];
  const obj = data as Record<string, unknown>;
  if (Array.isArray(obj.orders)) {
    return obj.orders as CoyoteOpsCheckInOrder[];
  }
  if (typeof obj.code === 'string' && Array.isArray(obj.lines)) {
    return [obj as unknown as CoyoteOpsCheckInOrder];
  }
  return [];
}

function parseListTotal(data: unknown, fallback: number): number {
  if (!data || typeof data !== 'object') return fallback;
  const total = (data as Record<string, unknown>).total;
  return typeof total === 'number' && Number.isFinite(total) ? total : fallback;
}

/** Next offset for coyote-ops list pagination, or null when the last page is reached. */
export function nextCoyoteOpsListOffset(
  offset: number,
  limit: number,
  pageOrderCount: number,
  total: number
): number | null {
  if (pageOrderCount < limit) return null;
  const next = offset + pageOrderCount;
  if (next >= total) return null;
  if (next > COYOTE_OPS_LIST_MAX_OFFSET) return null;
  return next;
}

async function coyoteOpsGet(url: URL): Promise<unknown> {
  const { coyoteOpsCheckinSecret } = getCheckinConfig();
  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${coyoteOpsCheckinSecret}`,
    },
    cache: 'no-store',
  });

  if (res.status === 404) return { orders: [] };
  if (res.status === 401) {
    throw new CoyoteOpsOrdersError('coyote-ops check-in unauthorized', 401);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new CoyoteOpsOrdersError(
      `coyote-ops check-in failed (${res.status})${text ? `: ${text.slice(0, 200)}` : ''}`,
      res.status
    );
  }

  return (await res.json()) as unknown;
}

function ordersBaseUrl(): URL {
  const { coyoteOpsOrdersBaseUrl } = getCheckinConfig();
  return new URL('/api/check-in/orders', coyoteOpsOrdersBaseUrl);
}

/**
 * Lookup coyote-ops orders for gate check-in (P6).
 * Auth: Authorization Bearer CHECKIN_API_SECRET
 */
export async function fetchCoyoteOpsOrders(params: {
  code?: string;
  email?: string;
  event?: string;
}): Promise<NormalizedOrder[]> {
  if (!isCoyoteOpsConfigured()) return [];

  const url = ordersBaseUrl();
  if (params.code?.trim()) url.searchParams.set('code', params.code.trim());
  if (params.email?.trim()) url.searchParams.set('email', params.email.trim());
  if (params.event?.trim()) url.searchParams.set('event', params.event.trim());

  if (!url.searchParams.has('code') && !url.searchParams.has('email')) {
    return [];
  }

  const data = await coyoteOpsGet(url);
  return parseOrderList(data)
    .map(normalizeCoyoteOpsOrder)
    .filter((o) => o.lines.length > 0);
}

export async function fetchCoyoteOpsOrdersPage(
  offset: number,
  limit = COYOTE_OPS_LIST_PAGE_LIMIT
): Promise<CoyoteOpsOrdersPage> {
  if (!isCoyoteOpsConfigured()) {
    return { orders: [], rawCount: 0, total: 0 };
  }

  const url = ordersBaseUrl();
  url.searchParams.set('offset', String(Math.max(0, offset)));
  url.searchParams.set('limit', String(Math.max(1, limit)));

  const data = await coyoteOpsGet(url);
  const raw = parseOrderList(data);
  const orders = raw.map(normalizeCoyoteOpsOrder).filter((o) => o.lines.length > 0);
  const total = parseListTotal(data, offset + raw.length);
  return { orders, rawCount: raw.length, total };
}

/** Full paid/pending store catalog from coyote-ops for ticket counts. */
export async function fetchAllCoyoteOpsOrders(): Promise<NormalizedOrder[]> {
  if (!isCoyoteOpsConfigured()) return [];

  const all: NormalizedOrder[] = [];
  let offset = 0;
  const limit = COYOTE_OPS_LIST_PAGE_LIMIT;

  for (;;) {
    const page = await fetchCoyoteOpsOrdersPage(offset, limit);
    all.push(...page.orders);
    const next = nextCoyoteOpsListOffset(offset, limit, page.rawCount, page.total);
    if (next == null) break;
    offset = next;
  }

  return all;
}

/** Merge by orderId (case-insensitive); coyote-ops wins on conflict. */
export function mergeNormalizedOrders(
  webflow: NormalizedOrder[],
  coyoteOps: NormalizedOrder[]
): NormalizedOrder[] {
  const map = new Map<string, NormalizedOrder>();
  for (const o of webflow) {
    map.set(o.orderId.toLowerCase(), o);
  }
  for (const o of coyoteOps) {
    map.set(o.orderId.toLowerCase(), o);
  }
  return [...map.values()];
}
