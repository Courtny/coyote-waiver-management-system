import { getCheckinConfig, isWebflowConfigured } from './checkin-config';
import {
  countCachedOrdersInDb,
  getWebflowOrdersSyncMeta,
  loadCachedOrdersFromDb,
  productIdsFromOrders,
  setWebflowOrdersSyncMeta,
  upsertCachedOrdersReturningNewIds,
} from './webflow-orders-store';
import {
  planWebflowOrdersSync,
  WEBFLOW_ORDERS_PAGE_LIMIT,
} from './webflow-orders-sync-plan';
import {
  fetchWebflowOrdersPage,
  NormalizedOrder,
  WebflowOrdersError,
} from './webflow-orders';

export { planWebflowOrdersSync } from './webflow-orders-sync-plan';

type CacheEntry = {
  orders: NormalizedOrder[];
  fetchedAt: number;
};

export type CachedWebflowOrdersResult = {
  orders: NormalizedOrder[];
  stale: boolean;
  error?: WebflowOrdersError;
  /** Product IDs that received newly inserted orders during this sync (not mere updates). */
  newlyOrderedProductIds: Set<string>;
};

let memory: CacheEntry | null = null;

/**
 * Sync Webflow orders into Postgres.
 * - Empty DB: full pagination
 * - Warm: always refresh page 0; if total grew, keep paging until caught up
 */
export async function syncWebflowOrdersToDb(): Promise<{
  orders: NormalizedOrder[];
  newlyOrderedProductIds: Set<string>;
  total: number;
}> {
  const meta = await getWebflowOrdersSyncMeta();
  const cachedCount = await countCachedOrdersInDb();
  const newOrderIdSet = new Set<string>();

  const page0 = await fetchWebflowOrdersPage(0, WEBFLOW_ORDERS_PAGE_LIMIT);
  let apiTotal = page0.total;
  for (const id of await upsertCachedOrdersReturningNewIds(page0.orders)) {
    newOrderIdSet.add(id);
  }

  const plan = planWebflowOrdersSync({
    cachedOrderCount: cachedCount,
    lastKnownTotal: meta.lastKnownTotal,
    apiTotal,
  });

  if (plan.continuePaging) {
    let offset = WEBFLOW_ORDERS_PAGE_LIMIT;
    while (offset < apiTotal && offset <= 50000) {
      const page = await fetchWebflowOrdersPage(offset, WEBFLOW_ORDERS_PAGE_LIMIT);
      if (page.total > apiTotal) apiTotal = page.total;
      for (const id of await upsertCachedOrdersReturningNewIds(page.orders)) {
        newOrderIdSet.add(id);
      }
      if (page.rawCount < WEBFLOW_ORDERS_PAGE_LIMIT) break;
      offset += WEBFLOW_ORDERS_PAGE_LIMIT;
    }
  }

  await setWebflowOrdersSyncMeta(apiTotal);

  const orders = await loadCachedOrdersFromDb();
  const newOrders = orders.filter((o) => newOrderIdSet.has(o.orderId));
  return {
    orders,
    newlyOrderedProductIds: productIdsFromOrders(newOrders),
    total: apiTotal,
  };
}

export async function getCachedWebflowOrders(): Promise<CachedWebflowOrdersResult> {
  if (!isWebflowConfigured()) {
    return { orders: [], stale: false, newlyOrderedProductIds: new Set() };
  }

  const { cacheTtlMs } = getCheckinConfig();
  const now = Date.now();
  if (memory && now - memory.fetchedAt < cacheTtlMs) {
    return {
      orders: memory.orders,
      stale: false,
      newlyOrderedProductIds: new Set(),
    };
  }

  try {
    const { orders, newlyOrderedProductIds } = await syncWebflowOrdersToDb();
    memory = { orders, fetchedAt: now };
    return { orders, stale: false, newlyOrderedProductIds };
  } catch (e) {
    if (e instanceof WebflowOrdersError) {
      if (memory) {
        return {
          orders: memory.orders,
          stale: true,
          error: e,
          newlyOrderedProductIds: new Set(),
        };
      }
      // Fall back to durable DB cache if present
      try {
        const fromDb = await loadCachedOrdersFromDb();
        if (fromDb.length > 0) {
          memory = { orders: fromDb, fetchedAt: now };
          return {
            orders: fromDb,
            stale: true,
            error: e,
            newlyOrderedProductIds: new Set(),
          };
        }
      } catch {
        // ignore DB read failure; rethrow original
      }
      throw e;
    }
    throw e;
  }
}

export function clearWebflowOrdersCache() {
  memory = null;
}
