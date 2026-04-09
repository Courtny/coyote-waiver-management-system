import { addDays, startOfWeek } from 'date-fns';
import { formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz';
import type { NormalizedOrder } from './webflow-orders';
import type { OpenPlayConfig, OpenPlaySkuDay } from './open-play-config';

const ET = 'America/New_York';

/** Half-open window: Monday 00:00 ET through next Monday 00:00 ET (exclusive). */
export function getReportingWeekBounds(now: Date = new Date()): { start: Date; endExclusive: Date } {
  const zonedNow = toZonedTime(now, ET);
  const mondayLocal = startOfWeek(zonedNow, { weekStartsOn: 1 });
  mondayLocal.setHours(0, 0, 0, 0);
  const start = fromZonedTime(mondayLocal, ET);
  const nextMondayLocal = addDays(mondayLocal, 7);
  const endExclusive = fromZonedTime(nextMondayLocal, ET);
  return { start, endExclusive };
}

function parseOrderTime(iso: string | null): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
}

function isInstantInRange(t: number, start: Date, endExclusive: Date): boolean {
  return t >= start.getTime() && t < endExclusive.getTime();
}

/**
 * Public copy: exact counts hidden for 1–2 (shows "Under 3"); 0 shows as "0".
 * Raw values are never exposed to clients when using format-only output.
 */
export function blurTicketCount(n: number): string {
  if (!Number.isFinite(n) || n < 0) return '—';
  if (n === 0) return '0';
  if (n < 3) return 'Under 3';
  return String(Math.floor(n));
}

export type OpenPlayAggregates = {
  saturday: number;
  sunday: number;
};

function resolveOpenPlayDay(
  line: { variantId: string; sku: string },
  skuToDay: Record<string, OpenPlaySkuDay>,
  variantToDay: Record<string, OpenPlaySkuDay>
): OpenPlaySkuDay | undefined {
  const vid = line.variantId?.trim();
  if (vid && variantToDay[vid]) return variantToDay[vid];
  const sku = line.sku?.trim();
  if (sku && skuToDay[sku]) return skuToDay[sku];
  return undefined;
}

export function aggregateOpenPlayTicketCounts(
  orders: NormalizedOrder[],
  cfg: OpenPlayConfig,
  skuPartySize: Record<string, number>,
  bounds: { start: Date; endExclusive: Date }
): OpenPlayAggregates {
  const { productId, skuToDay, variantToDay } = cfg;
  const pid = productId.trim();
  const hasVariantMap = Object.keys(variantToDay).length > 0;
  const hasSkuMap = Object.keys(skuToDay).length > 0;
  if (!pid || (!hasVariantMap && !hasSkuMap)) {
    return { saturday: 0, sunday: 0 };
  }

  let saturday = 0;
  let sunday = 0;

  // Debug counters (session 9c411d) — hypothesis: H1 week window, H2 product id, H3 SKU/day map, H4 empty orders
  let ordersTotal = orders.length;
  let ordersNullAccepted = 0;
  let ordersOutsideWeekWindow = 0;
  let ordersInWeekWindow = 0;
  let linesProductMatchAnyOrder = 0;
  let linesProductInWindow = 0;
  let linesDayMiss = 0;
  const skuSeenForProduct = new Set<string>();

  for (const order of orders) {
    const ts = parseOrderTime(order.acceptedOn);
    if (ts == null) {
      ordersNullAccepted++;
    } else if (!isInstantInRange(ts, bounds.start, bounds.endExclusive)) {
      ordersOutsideWeekWindow++;
    } else {
      ordersInWeekWindow++;
    }

    const inWindow = ts != null && isInstantInRange(ts, bounds.start, bounds.endExclusive);

    for (const line of order.lines) {
      if (line.productId?.trim() !== pid) continue;
      linesProductMatchAnyOrder++;
      const skuKey = line.sku?.trim() ?? '';
      if (skuKey) skuSeenForProduct.add(skuKey);
      if (!inWindow) continue;

      linesProductInWindow++;
      const day = resolveOpenPlayDay(line, skuToDay, variantToDay);
      if (!day) {
        linesDayMiss++;
        continue;
      }
      const sku = line.sku?.trim() ?? '';
      const party = sku ? skuPartySize[sku] ?? 1 : 1;
      const add = line.quantity * party;
      if (day === 'saturday') saturday += add;
      else sunday += add;
    }
  }

  // #region agent log
  const debugData = {
    ordersTotal,
    ordersNullAccepted,
    ordersOutsideWeekWindow,
    ordersInWeekWindow,
    linesProductMatchAnyOrder,
    linesProductInWindow,
    linesDayMiss,
    saturday,
    sunday,
    productIdLen: pid.length,
    productIdSuffix: pid.slice(-6),
    skuMapKeyCount: Object.keys(skuToDay).length,
    variantMapKeyCount: Object.keys(variantToDay).length,
    skuSamplesFromOrders: [...skuSeenForProduct].slice(0, 12),
    weekStartIso: bounds.start.toISOString(),
    weekEndExIso: bounds.endExclusive.toISOString(),
  };
  const debugPayload = {
    sessionId: '9c411d',
    hypothesisId: 'H1-H4',
    location: 'open-play-counts.ts:aggregateOpenPlayTicketCounts',
    message: 'open_play_aggregation',
    data: debugData,
    timestamp: Date.now(),
  };
  fetch('http://127.0.0.1:7894/ingest/b643a5d8-d250-477e-88dd-d10cc6efdfdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '9c411d' },
    body: JSON.stringify(debugPayload),
  }).catch(() => {});
  console.error('[DEBUG_OPEN_PLAY]', JSON.stringify(debugPayload));
  // #endregion

  return { saturday, sunday };
}

export function formatOpenPlayWeekLabelEt(start: Date): string {
  const endSunday = addDays(start, 6);
  const a = formatInTimeZone(start, ET, 'MMM d');
  const b = formatInTimeZone(endSunday, ET, 'MMM d, yyyy');
  return `${a} – ${b}`;
}

export type OpenPlayPublicCountsPayload = {
  configured: boolean;
  weekLabel: string;
  saturdayDisplay: string;
  sundayDisplay: string;
  /** True when Webflow orders came from cache after a failed refresh */
  ordersStale: boolean;
};

export function buildOpenPlayPublicPayload(
  aggregates: OpenPlayAggregates,
  bounds: { start: Date; endExclusive: Date },
  options: { configured: boolean; ordersStale: boolean }
): OpenPlayPublicCountsPayload {
  return {
    configured: options.configured,
    weekLabel: formatOpenPlayWeekLabelEt(bounds.start),
    saturdayDisplay: blurTicketCount(aggregates.saturday),
    sundayDisplay: blurTicketCount(aggregates.sunday),
    ordersStale: options.ordersStale,
  };
}
