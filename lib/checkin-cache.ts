import { getCheckinConfig, isCoyoteOpsConfigured, isWebflowConfigured } from './checkin-config';
import {
  CoyoteOpsOrdersError,
  fetchAllCoyoteOpsOrders,
  mergeNormalizedOrders,
} from './coyote-ops-orders';
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
  error?: WebflowOrdersError | CoyoteOpsOrdersError;
  coyoteOpsError?: string;
  /** Product IDs that received newly inserted orders during this sync (not mere updates). */
  newlyOrderedProductIds: Set<string>;
};

let memory: CacheEntry | null = null;
let coyoteMemory: CacheEntry | null = null;

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
  coyoteMemory = null;
}

async function getCachedCoyoteOpsOrders(): Promise<CachedWebflowOrdersResult> {
  if (!isCoyoteOpsConfigured()) {
    return { orders: [], stale: false, newlyOrderedProductIds: new Set() };
  }

  const { cacheTtlMs } = getCheckinConfig();
  const now = Date.now();
  if (coyoteMemory && now - coyoteMemory.fetchedAt < cacheTtlMs) {
    return {
      orders: coyoteMemory.orders,
      stale: false,
      newlyOrderedProductIds: new Set(),
    };
  }

  try {
    const orders = await fetchAllCoyoteOpsOrders();
    const prevIds = new Set(coyoteMemory?.orders.map((o) => o.orderId) ?? []);
    const newOrders = coyoteMemory
      ? orders.filter((o) => !prevIds.has(o.orderId))
      : orders;
    coyoteMemory = { orders, fetchedAt: now };
    return {
      orders,
      stale: false,
      newlyOrderedProductIds: productIdsFromOrders(newOrders),
    };
  } catch (e) {
    if (e instanceof CoyoteOpsOrdersError) {
      if (coyoteMemory) {
        return {
          orders: coyoteMemory.orders,
          stale: true,
          error: e,
          coyoteOpsError: e.message,
          newlyOrderedProductIds: new Set(),
        };
      }
      throw e;
    }
    throw e;
  }
}

/**
 * Ticket counts / attendance source after cutover: coyote-ops store orders,
 * merged with the Webflow cache when that token is still configured.
 * coyote-ops wins on duplicate order ids.
 */
export async function getCachedCheckinOrders(): Promise<CachedWebflowOrdersResult> {
  let webflow: CachedWebflowOrdersResult = {
    orders: [],
    stale: false,
    newlyOrderedProductIds: new Set(),
  };
  let coyote: CachedWebflowOrdersResult = {
    orders: [],
    stale: false,
    newlyOrderedProductIds: new Set(),
  };
  let webflowCaught: WebflowOrdersError | undefined;
  let coyoteCaught: CoyoteOpsOrdersError | undefined;

  if (isWebflowConfigured()) {
    try {
      webflow = await getCachedWebflowOrders();
    } catch (e) {
      if (e instanceof WebflowOrdersError) webflowCaught = e;
      else throw e;
    }
  }

  if (isCoyoteOpsConfigured()) {
    try {
      coyote = await getCachedCoyoteOpsOrders();
    } catch (e) {
      if (e instanceof CoyoteOpsOrdersError) coyoteCaught = e;
      else throw e;
    }
  }

  const orders = mergeNormalizedOrders(webflow.orders, coyote.orders);
  const newlyOrderedProductIds = new Set<string>([
    ...webflow.newlyOrderedProductIds,
    ...coyote.newlyOrderedProductIds,
  ]);
  const error = coyote.error ?? coyoteCaught ?? webflow.error ?? webflowCaught;
  const coyoteOpsError = coyote.coyoteOpsError ?? coyoteCaught?.message;
  const stale = webflow.stale || coyote.stale;

  if (orders.length === 0 && error) {
    throw error;
  }

  return {
    orders,
    stale,
    ...(error ? { error } : {}),
    ...(coyoteOpsError ? { coyoteOpsError } : {}),
    newlyOrderedProductIds,
  };
}
