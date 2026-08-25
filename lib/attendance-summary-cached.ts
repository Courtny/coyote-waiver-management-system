import type { CheckinEventOption } from './checkin-config';
import {
  applyActiveFlags,
  buildAttendanceSummaries,
  collectProductIdsFromOrders,
  collectProductTitles,
  compareAttendanceSummaries,
  mergeAttendanceSummaries,
  resolveShowAsActive,
  type EventAttendanceSummary,
} from './checkin-attendance';
import {
  deleteFrozenSummary,
  getAllFrozenSummaries,
  upsertFrozenSummaries,
} from './event-ticket-summary-cache';
import type { NormalizedOrder } from './webflow-orders';

/**
 * Build ticket-count summary cards: recount Active products live; serve Past from
 * frozen snapshots (compute+persist when missing or when new orders arrived).
 */
export async function buildCachedAttendanceSummary(options: {
  orders: NormalizedOrder[];
  events: CheckinEventOption[];
  skuDisplay: Record<string, string>;
  flags: Map<string, boolean>;
  newlyOrderedProductIds: Set<string>;
}): Promise<{
  active: EventAttendanceSummary[];
  past: EventAttendanceSummary[];
  events: EventAttendanceSummary[];
}> {
  const { orders, events, skuDisplay, flags, newlyOrderedProductIds } = options;

  const allProductIds = collectProductIdsFromOrders(orders);
  const frozenPast = await getAllFrozenSummaries();
  const titlesByProduct = collectProductTitles(orders, events);
  for (const [id, frozen] of frozenPast) {
    if (!titlesByProduct.has(id)) titlesByProduct.set(id, frozen.title);
  }

  const activeIds = new Set<string>();
  const pastIds = new Set<string>();
  const candidateIds = new Set<string>([...allProductIds, ...frozenPast.keys()]);

  for (const productId of candidateIds) {
    const title = titlesByProduct.get(productId) || `Product ${productId}`;
    if (resolveShowAsActive({ productId, title }, flags)) activeIds.add(productId);
    else pastIds.add(productId);
  }

  const liveActive = applyActiveFlags(
    buildAttendanceSummaries(orders, events, skuDisplay, activeIds),
    flags
  ).filter((s) => Boolean(s.showAsActive));

  const pastProductIdsNeedingCompute: string[] = [];
  for (const id of pastIds) {
    const hasFrozen = frozenPast.has(id);
    const gotNewOrders = newlyOrderedProductIds.has(id);
    if (!hasFrozen || gotNewOrders) {
      pastProductIdsNeedingCompute.push(id);
    }
  }

  const needComputeSet = new Set(pastProductIdsNeedingCompute);
  const computedPast =
    needComputeSet.size > 0
      ? buildAttendanceSummaries(orders, events, skuDisplay, needComputeSet).map((s) => ({
          ...s,
          showAsActive: false as const,
        }))
      : [];

  const { active, past, toFreeze } = mergeAttendanceSummaries({
    liveActive,
    frozenPast,
    pastProductIdsNeedingCompute,
    computedPast,
  });

  if (toFreeze.length > 0) {
    await upsertFrozenSummaries(toFreeze);
  }

  // Drop any stale freeze for products that are Active again
  for (const id of activeIds) {
    if (frozenPast.has(id)) {
      await deleteFrozenSummary(id);
    }
  }

  const pastFiltered = past.filter((s) => !activeIds.has(s.productId.trim()));
  const eventSummaries = [...active, ...pastFiltered].sort(compareAttendanceSummaries);

  return {
    active,
    past: pastFiltered,
    events: eventSummaries,
  };
}

/** Build a single-product summary snapshot (for toggling Active → Past). */
export function buildSingleProductSummary(
  orders: NormalizedOrder[],
  productId: string,
  events: CheckinEventOption[],
  skuDisplay: Record<string, string>
): EventAttendanceSummary | null {
  const id = productId.trim();
  if (!id) return null;
  const summaries = buildAttendanceSummaries(orders, events, skuDisplay, new Set([id]));
  const found = summaries.find((s) => s.productId === id);
  if (!found) {
    const title = events.find((e) => e.id === id)?.label;
    return {
      productId: id,
      title: title || `Product ${id}`,
      orderCount: 0,
      totalTickets: 0,
      skuBreakdown: [],
      showAsActive: false,
    };
  }
  return { ...found, showAsActive: false };
}
