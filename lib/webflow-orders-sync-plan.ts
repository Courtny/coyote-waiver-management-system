export const WEBFLOW_ORDERS_PAGE_LIMIT = 100;

export type WebflowSyncPlan = {
  /** Always fetch and upsert page 0. */
  fetchPage0: true;
  /** Continue paging from PAGE_LIMIT until apiTotal (or end). */
  continuePaging: boolean;
  pageLimit: number;
};

/** Decide whether a warm cache needs a full catch-up beyond page 0. */
export function planWebflowOrdersSync(options: {
  cachedOrderCount: number;
  lastKnownTotal: number;
  apiTotal: number;
}): WebflowSyncPlan {
  const needsFullFill = options.cachedOrderCount === 0;
  const totalGrew = options.apiTotal > options.lastKnownTotal;
  return {
    fetchPage0: true,
    continuePaging: needsFullFill || totalGrew,
    pageLimit: WEBFLOW_ORDERS_PAGE_LIMIT,
  };
}
