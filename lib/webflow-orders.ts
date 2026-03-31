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
  /** Line total (often same Money shape as order `customerPaid`). */
  rowTotal?: { value?: unknown; unit?: string; string?: string };
};

export type WebflowOrderRaw = {
  orderId?: string;
  acceptedOn?: string | null;
  customerInfo?: { fullName?: string; email?: string };
  billingAddress?: { addressee?: string };
  /** Total paid; Webflow uses `value` + `unit` + human `string`. */
  customerPaid?: { value?: unknown; unit?: string; string?: string };
  netAmount?: { value?: unknown; unit?: string; string?: string };
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
  /** Best-effort order total in major currency units (e.g. dollars). */
  customerPaidAmount: number;
  /** ISO currency code when known. */
  customerPaidCurrency?: string;
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

const ZERO_DECIMAL_CURRENCIES = new Set([
  'BIF',
  'CLP',
  'DJF',
  'GNF',
  'JPY',
  'KMF',
  'KRW',
  'MGA',
  'PYG',
  'RWF',
  'UGX',
  'VND',
  'VUV',
  'XAF',
  'XOF',
  'XPF',
]);

function currencyMinorExponent(unit: string): number {
  const u = unit.trim().toUpperCase();
  if (!u) return 2;
  return ZERO_DECIMAL_CURRENCIES.has(u) ? 0 : 2;
}

/** Parse Webflow Money `string` (e.g. "$1,234.56") into a major-unit number. */
function parseMoneyDisplayString(s: string): number | null {
  const t = s.trim().replace(/\u00a0/g, ' ');
  if (!t) return null;
  const noSym = t.replace(/[$€£¥]/g, '').trim();
  const normalized = noSym.replace(/,/g, '');
  const n = parseFloat(normalized.replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

/**
 * Parse Webflow Order "Money" objects (`value`, `unit`, `string`).
 * Prefer `string` (major units). For bare numeric `value`, Webflow often sends **minor units**
 * (e.g. cents) for currencies with 2 decimal places — controlled by `useMinorUnits` from
 * CHECKIN_WEBFLOW_MONEY_MINOR_UNITS (default on).
 */
export function parseWebflowMoney(raw: unknown, useMinorUnits: boolean): { amount: number; currency?: string } {
  const r = asRecord(raw);
  if (!r) return { amount: 0 };
  const unit = str(r.unit ?? r['currency']).toUpperCase();
  const display = str(r.string);
  if (display) {
    const parsed = parseMoneyDisplayString(display);
    if (parsed != null) {
      return { amount: parsed, ...(unit ? { currency: unit } : {}) };
    }
  }

  const v = r.value;
  if (typeof v === 'string') {
    const vs = v.trim();
    if (vs.includes('.') || vs.includes(',')) {
      const normalized = vs.includes(',') && !vs.includes('.') ? vs.replace(',', '.') : vs.replace(/,/g, '');
      const n = parseFloat(normalized);
      if (Number.isFinite(n)) return { amount: n, ...(unit ? { currency: unit } : {}) };
    }
  }

  const n = num(v, NaN);
  if (!Number.isFinite(n)) return { amount: 0 };

  const exp = currencyMinorExponent(unit || 'USD');
  if (exp > 0 && useMinorUnits && Number.isInteger(n)) {
    return { amount: n / 10 ** exp, ...(unit ? { currency: unit } : {}) };
  }

  return { amount: n, ...(unit ? { currency: unit } : {}) };
}

function orderSpendFromRaw(o: Record<string, unknown>): { amount: number; currency?: string } {
  const { webflowMoneyMinorUnits: minor } = getCheckinConfig();

  const paid = parseWebflowMoney(o.customerPaid ?? o.customer_paid, minor);
  const net = parseWebflowMoney(o.netAmount ?? o.net_amount, minor);

  const items = Array.isArray(o.purchasedItems) ? o.purchasedItems : [];
  let linesSum = 0;
  let lineCurrency: string | undefined;
  for (const item of items) {
    const row = asRecord(item);
    if (!row) continue;
    const line = parseWebflowMoney(row.rowTotal ?? row.row_total, minor);
    linesSum += line.amount;
    if (!lineCurrency && line.currency) lineCurrency = line.currency;
  }

  if (paid.amount > 0) {
    return { amount: paid.amount, currency: paid.currency ?? lineCurrency };
  }
  if (net.amount > 0) {
    return { amount: net.amount, currency: net.currency ?? lineCurrency };
  }
  if (linesSum > 0) {
    return { amount: linesSum, currency: lineCurrency };
  }
  return { amount: 0, currency: lineCurrency };
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

  const spend = orderSpendFromRaw(o);

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
    customerPaidAmount: spend.amount,
    ...(spend.currency ? { customerPaidCurrency: spend.currency } : {}),
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
