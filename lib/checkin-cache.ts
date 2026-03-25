import { fetchAllWebflowOrders, NormalizedOrder, WebflowOrdersError } from './webflow-orders';
import { getCheckinConfig, isWebflowConfigured } from './checkin-config';

type CacheEntry = {
  orders: NormalizedOrder[];
  fetchedAt: number;
};

let memory: CacheEntry | null = null;

export async function getCachedWebflowOrders(): Promise<{
  orders: NormalizedOrder[];
  stale: boolean;
  error?: WebflowOrdersError;
}> {
  if (!isWebflowConfigured()) {
    return { orders: [], stale: false };
  }

  const { cacheTtlMs } = getCheckinConfig();
  const now = Date.now();
  if (memory && now - memory.fetchedAt < cacheTtlMs) {
    return { orders: memory.orders, stale: false };
  }

  try {
    const orders = await fetchAllWebflowOrders();
    memory = { orders, fetchedAt: now };
    return { orders, stale: false };
  } catch (e) {
    if (e instanceof WebflowOrdersError) {
      if (memory) {
        return { orders: memory.orders, stale: true, error: e };
      }
      throw e;
    }
    throw e;
  }
}

export function clearWebflowOrdersCache() {
  memory = null;
}
