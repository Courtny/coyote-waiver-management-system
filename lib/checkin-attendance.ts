import type { CheckinEventOption } from './checkin-config';
import type { NormalizedOrder } from './webflow-orders';

export type SkuBreakdownRow = {
  sku: string;
  displayName: string;
  quantity: number;
  imageUrl?: string;
};

export type EventAttendanceSummary = {
  productId: string;
  title: string;
  orderCount: number;
  totalTickets: number;
  skuBreakdown: SkuBreakdownRow[];
  imageUrl?: string;
};

export type EventAttendanceLine = {
  orderId: string;
  orderedAt: string | null;
  customerName: string;
  customerEmail: string;
  sku: string;
  displayName: string;
  quantity: number;
  imageUrl?: string;
};

function displayForSku(sku: string, displayName: string, skuDisplay: Record<string, string>): string {
  if (sku && skuDisplay[sku]) return skuDisplay[sku];
  return displayName;
}

function eventTitle(
  productId: string,
  variantIds: string[],
  productName: string,
  events: CheckinEventOption[]
): string {
  const fromConfig = events.find((e) => e.id === productId || variantIds.includes(e.id));
  if (fromConfig?.label) return fromConfig.label;
  return productName || `Product ${productId}`;
}

/** Resolve display title for a product id using cached orders + CHECKIN_EVENTS_JSON */
export function resolveEventTitle(
  productId: string,
  orders: NormalizedOrder[],
  events: CheckinEventOption[]
): string {
  const pid = productId.trim();
  let productName = '';
  const variantIds = new Set<string>();
  for (const o of orders) {
    for (const l of o.lines) {
      if (l.productId?.trim() !== pid) continue;
      if (l.productName && l.productName.length > productName.length) productName = l.productName;
      if (l.variantId) variantIds.add(l.variantId);
    }
  }
  return eventTitle(pid, Array.from(variantIds), productName, events);
}

type SkuAgg = { displayName: string; qty: number; imageUrl?: string };

type Agg = {
  productId: string;
  productName: string;
  variantIds: Set<string>;
  skuMap: Map<string, SkuAgg>;
  orderIds: Set<string>;
  /** First variant image seen for this product (event card thumbnail). */
  imageUrl?: string;
};

export function buildAttendanceSummaries(
  orders: NormalizedOrder[],
  events: CheckinEventOption[],
  skuDisplay: Record<string, string>
): EventAttendanceSummary[] {
  const byProduct = new Map<string, Agg>();

  for (const order of orders) {
    const productsTouched = new Set<string>();
    for (const line of order.lines) {
      const pid = line.productId?.trim();
      if (!pid) continue;
      productsTouched.add(pid);

      let agg = byProduct.get(pid);
      if (!agg) {
        agg = {
          productId: pid,
          productName: line.productName || line.displayName,
          variantIds: new Set(),
          skuMap: new Map(),
          orderIds: new Set(),
        };
        byProduct.set(pid, agg);
      }
      if (line.variantId) agg.variantIds.add(line.variantId);
      if (line.productName && line.productName.length > (agg.productName?.length || 0)) {
        agg.productName = line.productName;
      }
      if (line.imageUrl && !agg.imageUrl) {
        agg.imageUrl = line.imageUrl;
      }

      const label = displayForSku(line.sku, line.displayName, skuDisplay);
      const key = line.sku || line.variantId || label;
      const prev = agg.skuMap.get(key);
      const addQty = line.quantity;
      if (prev) {
        prev.qty += addQty;
        if (!prev.imageUrl && line.imageUrl) {
          prev.imageUrl = line.imageUrl;
        }
      } else {
        agg.skuMap.set(key, {
          displayName: label,
          qty: addQty,
          ...(line.imageUrl ? { imageUrl: line.imageUrl } : {}),
        });
      }
    }
    for (const pid of productsTouched) {
      byProduct.get(pid)?.orderIds.add(order.orderId);
    }
  }

  const summaries: EventAttendanceSummary[] = [];

  for (const agg of byProduct.values()) {
    const skuBreakdown: SkuBreakdownRow[] = Array.from(agg.skuMap.entries())
      .map(([skuKey, v]) => ({
        sku: skuKey,
        displayName: v.displayName,
        quantity: v.qty,
        ...(v.imageUrl ? { imageUrl: v.imageUrl } : {}),
      }))
      .sort((a, b) => a.sku.localeCompare(b.sku));

    const totalTickets = skuBreakdown.reduce((s, r) => s + r.quantity, 0);

    summaries.push({
      productId: agg.productId,
      title: eventTitle(agg.productId, Array.from(agg.variantIds), agg.productName, events),
      orderCount: agg.orderIds.size,
      totalTickets,
      skuBreakdown,
      ...(agg.imageUrl ? { imageUrl: agg.imageUrl } : {}),
    });
  }

  summaries.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
  return summaries;
}

export function buildEventAttendanceLines(
  orders: NormalizedOrder[],
  productId: string,
  skuDisplay: Record<string, string>
): EventAttendanceLine[] {
  const rows: EventAttendanceLine[] = [];
  const pid = productId.trim();

  for (const order of orders) {
    const name = order.customerFullName?.trim() || order.billingAddressee?.trim() || '—';
    const email = order.customerEmail || '—';

    for (const line of order.lines) {
      if (line.productId?.trim() !== pid) continue;
      rows.push({
        orderId: order.orderId,
        orderedAt: order.acceptedOn,
        customerName: name,
        customerEmail: email,
        sku: line.sku || line.variantId || line.displayName,
        displayName: displayForSku(line.sku, line.displayName, skuDisplay),
        quantity: line.quantity,
        ...(line.imageUrl ? { imageUrl: line.imageUrl } : {}),
      });
    }
  }

  rows.sort((a, b) => {
    const cs = a.sku.localeCompare(b.sku);
    if (cs !== 0) return cs;
    const ta = a.orderedAt ? Date.parse(a.orderedAt) : 0;
    const tb = b.orderedAt ? Date.parse(b.orderedAt) : 0;
    if (tb !== ta) return tb - ta;
    return a.customerName.localeCompare(b.customerName, undefined, { sensitivity: 'base' });
  });

  return rows;
}
