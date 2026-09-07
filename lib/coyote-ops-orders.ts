import type { NormalizedOrder, NormalizedLineItem } from './webflow-orders';
import { getCheckinConfig, isCoyoteOpsConfigured } from './checkin-config';

export type CoyoteOpsCheckInLine = {
  sku: string;
  name: string;
  quantity: number;
  faction: string | null;
  productId: string | null;
  variantId: string | null;
};

export type CoyoteOpsCheckInOrder = {
  code: string;
  status: 'pending' | 'paid' | 'refunded' | 'failed';
  contact: { name: string; email: string };
  lines: CoyoteOpsCheckInLine[];
  paidAt: string | null;
  source: 'web' | 'webflow_legacy';
};

export class CoyoteOpsOrdersError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.name = 'CoyoteOpsOrdersError';
    this.status = status;
  }
}

function toNormalized(order: CoyoteOpsCheckInOrder): NormalizedOrder {
  const lines: NormalizedLineItem[] = order.lines.map((line) => ({
    productId: line.productId ?? '',
    productName: line.name,
    variantId: line.variantId ?? '',
    sku: line.sku,
    displayName: line.name,
    quantity: line.quantity,
  }));

  return {
    orderId: order.code,
    acceptedOn: order.paidAt,
    customerEmail: (order.contact.email || '').trim().toLowerCase(),
    customerFullName: order.contact.name || '',
    billingAddressee: order.contact.name || '',
    customerPaidAmount: 0,
    lines,
  };
}

function parseResponse(data: unknown): CoyoteOpsCheckInOrder[] {
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

  const { coyoteOpsOrdersBaseUrl, coyoteOpsCheckinSecret } = getCheckinConfig();
  const url = new URL('/api/check-in/orders', coyoteOpsOrdersBaseUrl);
  if (params.code?.trim()) url.searchParams.set('code', params.code.trim());
  if (params.email?.trim()) url.searchParams.set('email', params.email.trim());
  if (params.event?.trim()) url.searchParams.set('event', params.event.trim());

  if (!url.searchParams.has('code') && !url.searchParams.has('email')) {
    return [];
  }

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${coyoteOpsCheckinSecret}`,
    },
    cache: 'no-store',
  });

  if (res.status === 404) return [];
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

  const data = (await res.json()) as unknown;
  return parseResponse(data).map(toNormalized);
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
