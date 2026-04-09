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

/** When Webflow order lines use the same base SKU for Sat/Sun, day often appears in the variant display name. */
function inferDayFromLabel(text: string): OpenPlaySkuDay | undefined {
  const t = text.toLowerCase();
  if (/\bsaturday\b/.test(t)) return 'saturday';
  if (/\bsunday\b/.test(t)) return 'sunday';
  return undefined;
}

/** e.g. open-play-airsoft-admission-only-saturday */
function inferDayFromSkuSuffix(sku: string): OpenPlaySkuDay | undefined {
  const s = sku.toLowerCase();
  if (s.endsWith('-saturday') || s.endsWith('_saturday')) return 'saturday';
  if (s.endsWith('-sunday') || s.endsWith('_sunday')) return 'sunday';
  return undefined;
}

function resolveOpenPlayDay(
  line: { variantId: string; sku: string; displayName: string },
  skuToDay: Record<string, OpenPlaySkuDay>,
  variantToDay: Record<string, OpenPlaySkuDay>
): OpenPlaySkuDay | undefined {
  const vid = line.variantId?.trim();
  if (vid && variantToDay[vid]) return variantToDay[vid];
  const sku = line.sku?.trim();
  if (sku && skuToDay[sku]) return skuToDay[sku];
  if (sku) {
    const fromSuffix = inferDayFromSkuSuffix(sku);
    if (fromSuffix) return fromSuffix;
  }
  return inferDayFromLabel(line.displayName ?? '');
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

  for (const order of orders) {
    const ts = parseOrderTime(order.acceptedOn);
    if (ts == null || !isInstantInRange(ts, bounds.start, bounds.endExclusive)) continue;

    for (const line of order.lines) {
      if (line.productId?.trim() !== pid) continue;
      const day = resolveOpenPlayDay(line, skuToDay, variantToDay);
      if (!day) continue;
      const sku = line.sku?.trim() ?? '';
      const party = sku ? skuPartySize[sku] ?? 1 : 1;
      const add = line.quantity * party;
      if (day === 'saturday') saturday += add;
      else sunday += add;
    }
  }

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
