import { getCheckinConfig } from './checkin-config';

const WEBFLOW_API = 'https://api.webflow.com/v2';

export type WebflowPurchasedItem = {
  count?: number;
  productId?: string;
  productName?: string;
  variantId?: string;
  variantName?: string;
  variantSKU?: string;
  variantImage?: { url?: string; file?: { variants?: unknown[] } };
};

export type WebflowOrderRaw = {
  orderId?: string;
  acceptedOn?: string | null;
  customerInfo?: { fullName?: string; email?: string };
  billingAddress?: { addressee?: string };
  purchasedItems?: WebflowPurchasedItem[];
};

export type NormalizedLineItem = {
  productId: string;
  productName: string;
  variantId: string;
  sku: string;
  displayName: string;
  quantity: number;
  imageUrl?: string;
};

export type NormalizedOrder = {
  orderId: string;
  acceptedOn: string | null;
  customerEmail: string;
  customerFullName: string;
  billingAddressee: string;
  lines: NormalizedLineItem[];
};

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function num(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

/** Resolve hosted image URL from Webflow order line `variantImage`. */
export function variantImageUrl(variantImage: unknown): string | undefined {
  const img = asRecord(variantImage);
  if (!img) return undefined;
  const direct = str(img.url);
  if (direct) return direct;
  const file = asRecord(img.file);
  if (!file) return undefined;
  const variants = Array.isArray(file.variants) ? file.variants : [];
  for (const v of variants) {
    const u = str(asRecord(v)?.url);
    if (u) return u;
  }
  return undefined;
}

export function normalizeWebflowOrder(raw: unknown): NormalizedOrder | null {
  const o = asRecord(raw);
  if (!o) return null;
  const orderId = str(o.orderId);
  if (!orderId) return null;

  const customerInfo = asRecord(o.customerInfo);
  const billing = asRecord(o.billingAddress);

  const items = Array.isArray(o.purchasedItems) ? o.purchasedItems : [];
  const lines: NormalizedLineItem[] = [];

  for (const item of items) {
    const row = asRecord(item);
    if (!row) continue;
    const sku = str(row.variantSKU);
    const variantName = str(row.variantName);
    const productName = str(row.productName);
    const displayName = [productName, variantName].filter(Boolean).join(' — ') || sku || 'Item';
    const qty = Math.max(1, Math.round(num(row.count, 1)));
    const imageUrl = variantImageUrl(row.variantImage);
    lines.push({
      productId: str(row.productId),
      productName: productName || displayName,
      variantId: str(row.variantId),
      sku,
      displayName,
      quantity: qty,
      ...(imageUrl ? { imageUrl } : {}),
    });
  }

  return {
    orderId,
    acceptedOn: o.acceptedOn != null && typeof o.acceptedOn === 'string' ? o.acceptedOn : null,
    customerEmail: str(customerInfo?.email).toLowerCase(),
    customerFullName: str(customerInfo?.fullName),
    billingAddressee: str(billing?.addressee),
    lines,
  };
}

type ListOrdersResponse = {
  orders?: unknown[];
  items?: unknown[];
  pagination?: { total?: number; limit?: number; offset?: number };
};

export class WebflowOrdersError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = 'WebflowOrdersError';
  }
}

export async function fetchAllWebflowOrders(): Promise<NormalizedOrder[]> {
  const { webflowToken, webflowSiteId } = getCheckinConfig();
  if (!webflowToken || !webflowSiteId) {
    throw new WebflowOrdersError('Webflow is not configured (WEBFLOW_API_TOKEN / WEBFLOW_SITE_ID)', 503);
  }

  const all: NormalizedOrder[] = [];
  let offset = 0;
  const limit = 100;

  for (;;) {
    const url = `${WEBFLOW_API}/sites/${encodeURIComponent(webflowSiteId)}/orders?limit=${limit}&offset=${offset}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${webflowToken}`,
        Accept: 'application/json',
      },
      next: { revalidate: 0 },
    });

    if (res.status === 401 || res.status === 403) {
      throw new WebflowOrdersError('Webflow API rejected the token (check ecommerce:read scope)', res.status);
    }
    if (res.status === 429) {
      throw new WebflowOrdersError('Webflow API rate limited; try again shortly', 429);
    }
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new WebflowOrdersError(`Webflow orders request failed (${res.status}): ${text.slice(0, 200)}`, res.status);
    }

    const body = (await res.json()) as ListOrdersResponse;
    const batch = Array.isArray(body.orders)
      ? body.orders
      : Array.isArray(body.items)
        ? body.items
        : [];
    for (const row of batch) {
      const n = normalizeWebflowOrder(row);
      if (n && n.lines.length > 0) all.push(n);
    }

    if (batch.length < limit) break;
    offset += limit;
    if (offset > 50000) break;
  }

  return all;
}
