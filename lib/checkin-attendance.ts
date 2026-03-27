import type { CheckinEventOption } from './checkin-config';
import type { NormalizedLineItem, NormalizedOrder } from './webflow-orders';

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
  displayName: string;
  quantity: number;
  /** From CHECKIN_SKU_PARTY_SIZE; used for multi-person waiver UI rules. */
  partySize: number;
  imageUrl?: string;
  waiverIndicator?: WaiverIndicatorDto;
};

function displayForSku(sku: string, displayName: string, skuDisplay: Record<string, string>): string {
  if (sku && skuDisplay[sku]) return skuDisplay[sku];
  return displayName;
}

/** Same aggregation key as skuMap / detail rows; must match allowlist entries (variant SKU strings). */
function lineSkuAggregationKey(
  line: NormalizedLineItem,
  skuDisplay: Record<string, string>
): string {
  const label = displayForSku(line.sku, line.displayName, skuDisplay);
  return line.sku || line.variantId || label;
}

function normalizeSkuCompare(s: string): string {
  return s.trim().toLowerCase();
}

/** Env allowlist entries may differ by case/whitespace from Webflow variant SKU. */
function allowlistIncludesKey(allowed: string[], key: string): boolean {
  if (!key) return false;
  const nk = normalizeSkuCompare(key);
  return allowed.some((a) => normalizeSkuCompare(a) === nk);
}

export function lineMatchesProductSkuAllowlist(
  productId: string,
  line: NormalizedLineItem,
  allowlist: Record<string, string[]>,
  skuDisplay: Record<string, string>
): boolean {
  const allowed = allowlist[productId];
  if (!allowed || allowed.length === 0) return true;
  return allowlistIncludesKey(allowed, lineSkuAggregationKey(line, skuDisplay));
}

/**
 * If env uses a Webflow CMS item id but order line items carry a different ecommerce productId,
 * no lines match allowlist[productId] and filtering is skipped. When the configured id never
 * appears on any order line but exactly one other productId has lines whose aggregation keys
 * are in that allowlist, copy the allowlist to that product id.
 */
function expandProductSkuAllowlistAliases(
  orders: NormalizedOrder[],
  base: Record<string, string[]>,
  skuDisplay: Record<string, string>
): { effective: Record<string, string[]>; aliases: { configPid: string; actualPid: string }[] } {
  const out: Record<string, string[]> = { ...base };
  const aliases: { configPid: string; actualPid: string }[] = [];

  for (const [configPid, skus] of Object.entries(base)) {
    if (!skus.length) continue;

    let configSeen = false;
    for (const o of orders) {
      for (const l of o.lines) {
        if (l.productId?.trim() === configPid) {
          configSeen = true;
          break;
        }
      }
      if (configSeen) break;
    }
    if (configSeen) continue;

    const candidatePids = new Set<string>();
    for (const o of orders) {
      for (const l of o.lines) {
        const pid = l.productId?.trim();
        if (!pid) continue;
        const key = lineSkuAggregationKey(l, skuDisplay);
        if (allowlistIncludesKey(skus, key)) candidatePids.add(pid);
      }
    }

    if (candidatePids.size === 0) {
      // #region agent log
      const samples: { pid: string; rawSku: string; aggKey: string }[] = [];
      outerSamples: for (const o of orders) {
        for (const l of o.lines) {
          const pid = l.productId?.trim();
          if (!pid) continue;
          samples.push({ pid, rawSku: l.sku, aggKey: lineSkuAggregationKey(l, skuDisplay) });
          if (samples.length >= 12) break outerSamples;
        }
      }
      const payload = {
        sessionId: '0dcbc7',
        runId: 'alias-fail',
        hypothesisId: 'H-alias-0',
        location: 'checkin-attendance.ts:expandProductSkuAllowlistAliases',
        message:
          'Allowlist alias skipped: config product id not on orders and no line matched allowlist SKUs',
        data: { configPid, allowlistSkuCount: skus.length, lineSamples: samples },
        timestamp: Date.now(),
      };
      console.log('[debug-0dcbc7]', JSON.stringify(payload));
      fetch('http://127.0.0.1:7243/ingest/b643a5d8-d250-477e-88dd-d10cc6efdfdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '0dcbc7' },
        body: JSON.stringify(payload),
      }).catch(() => {});
      // #endregion
      continue;
    }

    for (const pid of candidatePids) {
      if (!out[pid]) {
        out[pid] = skus;
        aliases.push({ configPid, actualPid: pid });
      }
    }
  }

  // #region agent log
  if (aliases.length > 0) {
    const payload = {
      sessionId: '0dcbc7',
      runId: 'post-fix',
      hypothesisId: 'H3-alias',
      location: 'checkin-attendance.ts:expandProductSkuAllowlistAliases',
      message: 'Mapped allowlist from config product id to order line productId',
      data: { aliases },
      timestamp: Date.now(),
    };
    console.log('[debug-0dcbc7]', JSON.stringify(payload));
    fetch('http://127.0.0.1:7243/ingest/b643a5d8-d250-477e-88dd-d10cc6efdfdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '0dcbc7' },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }
  // #endregion

  return { effective: out, aliases };
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
  skuDisplay: Record<string, string>,
  productSkuAllowlist: Record<string, string[]>
): EventAttendanceSummary[] {
  const { effective: effectiveAllowlist } = expandProductSkuAllowlistAliases(
    orders,
    productSkuAllowlist,
    skuDisplay
  );

  const byProduct = new Map<string, Agg>();

  for (const order of orders) {
    const productsTouched = new Set<string>();
    for (const line of order.lines) {
      const pid = line.productId?.trim();
      if (!pid) continue;
      if (!lineMatchesProductSkuAllowlist(pid, line, effectiveAllowlist, skuDisplay)) continue;
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
      const key = lineSkuAggregationKey(line, skuDisplay);
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

  // #region agent log
  try {
    const allowKeys = Object.keys(effectiveAllowlist);
    if (allowKeys.length > 0) {
      const allLinePids = new Set<string>();
      const excludedKeysSample: Record<string, string[]> = {};
      let sampleForAllowlistPid: { sku: string; aggKey: string } | null = null;
      const targetPid = allowKeys[0];
      outerSample: for (const order of orders) {
        for (const line of order.lines) {
          if (line.productId?.trim() === targetPid) {
            sampleForAllowlistPid = {
              sku: line.sku,
              aggKey: lineSkuAggregationKey(line, skuDisplay),
            };
            break outerSample;
          }
        }
      }
      for (const order of orders) {
        for (const line of order.lines) {
          const pid = line.productId?.trim();
          if (!pid) continue;
          allLinePids.add(pid);
          const allowed = effectiveAllowlist[pid];
          if (!allowed?.length) continue;
          const key = lineSkuAggregationKey(line, skuDisplay);
          if (!allowlistIncludesKey(allowed, key)) {
            if (!excludedKeysSample[pid]) excludedKeysSample[pid] = [];
            if (excludedKeysSample[pid].length < 8) excludedKeysSample[pid].push(key);
          }
        }
      }
      const payload = {
        sessionId: '0dcbc7',
        runId: 'attendance-summary',
        hypothesisId: 'H2-H4',
        location: 'checkin-attendance.ts:buildAttendanceSummaries',
        message: 'allowlist vs order productIds and excluded sku keys',
        data: {
          allowlistKeys: allowKeys,
          allowlistKeySeenOnAnyOrderLine: allowKeys.map((k) => ({ key: k, seen: allLinePids.has(k) })),
          firstAllowlistProductSampleLine: sampleForAllowlistPid,
          excludedAggregationKeysSample: excludedKeysSample,
        },
        timestamp: Date.now(),
      };
      console.log('[debug-0dcbc7]', JSON.stringify(payload));
      fetch('http://127.0.0.1:7243/ingest/b643a5d8-d250-477e-88dd-d10cc6efdfdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '0dcbc7' },
        body: JSON.stringify(payload),
      }).catch(() => {});
    }
  } catch {
    /* ignore debug */
  }
  // #endregion

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
  skuDisplay: Record<string, string>,
  skuPartySize: Record<string, number>,
  productSkuAllowlist: Record<string, string[]>
): EventAttendanceLine[] {
  const { effective: effectiveAllowlist } = expandProductSkuAllowlistAliases(
    orders,
    productSkuAllowlist,
    skuDisplay
  );

  const rows: EventAttendanceLine[] = [];
  const pid = productId.trim();

  for (const order of orders) {
    const name = order.customerFullName?.trim() || order.billingAddressee?.trim() || '—';
    const email = order.customerEmail || '—';

    for (const line of order.lines) {
      if (line.productId?.trim() !== pid) continue;
      if (!lineMatchesProductSkuAllowlist(pid, line, effectiveAllowlist, skuDisplay)) continue;
      const skuKey = lineSkuAggregationKey(line, skuDisplay);
      const partySize = line.sku ? skuPartySize[line.sku] ?? 1 : 1;
      rows.push({
        orderId: order.orderId,
        orderedAt: order.acceptedOn,
        customerName: name,
        customerEmail: email,
        sku: skuKey,
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
