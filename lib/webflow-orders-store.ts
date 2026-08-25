import { pool } from './db';
import type { NormalizedOrder } from './webflow-orders';

export type WebflowOrdersSyncMeta = {
  lastSyncAt: Date | null;
  lastKnownTotal: number;
};

export async function loadCachedOrdersFromDb(): Promise<NormalizedOrder[]> {
  const result = await pool.query<{ payload: NormalizedOrder }>(
    `SELECT payload FROM webflow_orders_cache ORDER BY "acceptedOn" DESC NULLS LAST, "orderId"`
  );
  return result.rows.map((r) => r.payload);
}

export async function countCachedOrdersInDb(): Promise<number> {
  const result = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM webflow_orders_cache`
  );
  return Number(result.rows[0]?.count ?? 0);
}

export async function getWebflowOrdersSyncMeta(): Promise<WebflowOrdersSyncMeta> {
  const result = await pool.query<{ lastSyncAt: Date | null; lastKnownTotal: number }>(
    `SELECT "lastSyncAt", "lastKnownTotal" FROM webflow_orders_sync_meta WHERE id = 1`
  );
  const row = result.rows[0];
  return {
    lastSyncAt: row?.lastSyncAt ?? null,
    lastKnownTotal: row?.lastKnownTotal ?? 0,
  };
}

/** Returns order IDs that did not exist before this upsert. */
export async function upsertCachedOrdersReturningNewIds(
  orders: NormalizedOrder[]
): Promise<string[]> {
  if (orders.length === 0) return [];

  const newIds: string[] = [];
  for (const order of orders) {
    const result = await pool.query<{ isInsert: boolean }>(
      `INSERT INTO webflow_orders_cache ("orderId", payload, "acceptedOn", "updatedAt")
       VALUES ($1, $2::jsonb, $3, CURRENT_TIMESTAMP)
       ON CONFLICT ("orderId") DO UPDATE
         SET payload = EXCLUDED.payload,
             "acceptedOn" = EXCLUDED."acceptedOn",
             "updatedAt" = CURRENT_TIMESTAMP
       RETURNING (xmax = 0) AS "isInsert"`,
      [order.orderId, JSON.stringify(order), order.acceptedOn]
    );
    if (result.rows[0]?.isInsert) {
      newIds.push(order.orderId);
    }
  }
  return newIds;
}

export async function setWebflowOrdersSyncMeta(lastKnownTotal: number): Promise<void> {
  await pool.query(
    `INSERT INTO webflow_orders_sync_meta (id, "lastSyncAt", "lastKnownTotal", "updatedAt")
     VALUES (1, CURRENT_TIMESTAMP, $1, CURRENT_TIMESTAMP)
     ON CONFLICT (id) DO UPDATE
       SET "lastSyncAt" = CURRENT_TIMESTAMP,
           "lastKnownTotal" = EXCLUDED."lastKnownTotal",
           "updatedAt" = CURRENT_TIMESTAMP`,
    [lastKnownTotal]
  );
}

/** Product IDs touched by the given orders (from line items). */
export function productIdsFromOrders(orders: NormalizedOrder[]): Set<string> {
  const ids = new Set<string>();
  for (const order of orders) {
    for (const line of order.lines) {
      const pid = line.productId?.trim();
      if (pid) ids.add(pid);
    }
  }
  return ids;
}
