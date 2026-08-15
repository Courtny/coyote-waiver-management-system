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

export type WaiverIndicatorDto = {
  level: 'green' | 'yellow' | 'red';
  tooltip: string;
};

export type EventAttendanceLine = {
  orderId: string;
  orderedAt: string | null;
  customerName: string;
  customerEmail: string;
  sku: string;
  variantId: string;
  displayName: string;
  quantity: number;
  /** From CHECKIN_SKU_PARTY_SIZE; used for multi-person waiver UI rules. */
  partySize: number;
  imageUrl?: string;
  waiverIndicator?: WaiverIndicatorDto;
  receivesEventPatch?: boolean;
  /** Unit indices (0..quantity-1) marked checked in for this line. */
  checkedInUnits?: number[];
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

/** Known Webflow product ids for Open Play (also matchable by title). */
export const AIRSOFT_OPEN_PLAY_PRODUCT_ID = '66a2a82ee43b0a9a111c999c';
export const PAINTBALL_OPEN_PLAY_PRODUCT_ID = '66a15ea8d3dec3dd5909824c';

/** Parse Webflow/Mongo ObjectId creation time (ms), or 0 if not a 24-char hex id. */
export function productIdCreatedAtMs(productId: string): number {
  const id = productId.trim();
  if (!/^[a-f0-9]{24}$/i.test(id)) return 0;
  const seconds = parseInt(id.slice(0, 8), 16);
  return Number.isFinite(seconds) ? seconds * 1000 : 0;
}

/**
 * Pin rank for ticket summary cards:
 * 0 = Airsoft Open Play, 1 = Paintball Open Play, 2 = everything else.
 */
export function openPlayPinRank(summary: { productId: string; title: string }): number {
  const pid = summary.productId.trim();
  const title = summary.title || '';
  if (pid === AIRSOFT_OPEN_PLAY_PRODUCT_ID) return 0;
  if (pid === PAINTBALL_OPEN_PLAY_PRODUCT_ID) return 1;
  const isOpenPlay = /open\s*play/i.test(title);
  if (isOpenPlay && /airsoft/i.test(title)) return 0;
  if (isOpenPlay && /paintball/i.test(title)) return 1;
  return 2;
}

export function compareAttendanceSummaries(
  a: { productId: string; title: string },
  b: { productId: string; title: string }
): number {
  const pinDiff = openPlayPinRank(a) - openPlayPinRank(b);
  if (pinDiff !== 0) return pinDiff;
  const timeDiff = productIdCreatedAtMs(b.productId) - productIdCreatedAtMs(a.productId);
  if (timeDiff !== 0) return timeDiff;
  return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
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

  summaries.sort(compareAttendanceSummaries);
  return summaries;
}

export function buildEventAttendanceLines(
  orders: NormalizedOrder[],
  productId: string,
  skuDisplay: Record<string, string>,
  skuPartySize: Record<string, number>
): EventAttendanceLine[] {
  const rows: EventAttendanceLine[] = [];
  const pid = productId.trim();

  for (const order of orders) {
    const name = order.customerFullName?.trim() || order.billingAddressee?.trim() || '—';
    const email = order.customerEmail || '—';

    for (const line of order.lines) {
      if (line.productId?.trim() !== pid) continue;
      const skuKey = line.sku || line.variantId || line.displayName;
      const partySize = line.sku ? skuPartySize[line.sku] ?? 1 : 1;
      rows.push({
        orderId: order.orderId,
        orderedAt: order.acceptedOn,
        customerName: name,
        customerEmail: email,
        sku: skuKey,
        variantId: line.variantId || '',
        displayName: displayForSku(line.sku, line.displayName, skuDisplay),
        quantity: line.quantity,
        partySize,
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

/** Flag the earliest `patchCount` lines (by order date) as event-patch recipients. */
export function flagEventPatchRecipients(lines: EventAttendanceLine[], patchCount: number): void {
  if (patchCount <= 0 || lines.length === 0) return;

  const byDate = [...lines].sort((a, b) => {
    const ta = a.orderedAt ? Date.parse(a.orderedAt) : 0;
    const tb = b.orderedAt ? Date.parse(b.orderedAt) : 0;
    if (ta !== tb) return ta - tb;
    return a.orderId.localeCompare(b.orderId, undefined, { sensitivity: 'base' });
  });

  const limit = Math.min(patchCount, byDate.length);
  for (let i = 0; i < limit; i++) {
    byDate[i].receivesEventPatch = true;
  }
}

/** Default early-registrant patch count for FTX/STX events. */
export const DEFAULT_FTX_STX_PATCH_COUNT = 40;

/** True when the event title contains a whole-word FTX or STX (case-insensitive). */
export function isFtxOrStxEventTitle(title: string): boolean {
  return /\b(?:FTX|STX)\b/i.test(title);
}

/**
 * Resolve how many earliest lines get "Receives Event Patch".
 * Explicit config wins; otherwise FTX/STX titles default to 40.
 */
export function resolveEventPatchCount(
  title: string,
  eventCfg?: { eventPatchCount?: number }
): number | undefined {
  if (eventCfg?.eventPatchCount && eventCfg.eventPatchCount >= 1) {
    return eventCfg.eventPatchCount;
  }
  if (isFtxOrStxEventTitle(title)) return DEFAULT_FTX_STX_PATCH_COUNT;
  return undefined;
}
