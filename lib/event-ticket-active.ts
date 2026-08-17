import { pool } from './db';

export async function getEventActiveFlags(): Promise<Map<string, boolean>> {
  const result = await pool.query<{ productId: string; showAsActive: boolean }>(
    `SELECT "productId", "showAsActive" FROM event_ticket_active`
  );
  const map = new Map<string, boolean>();
  for (const row of result.rows) {
    map.set(row.productId, Boolean(row.showAsActive));
  }
  return map;
}

export async function setEventActiveFlag(productId: string, showAsActive: boolean): Promise<boolean> {
  const id = productId.trim();
  if (!id) {
    throw new Error('Missing productId');
  }

  await pool.query(
    `INSERT INTO event_ticket_active ("productId", "showAsActive", "updatedAt")
     VALUES ($1, $2, CURRENT_TIMESTAMP)
     ON CONFLICT ("productId") DO UPDATE
       SET "showAsActive" = EXCLUDED."showAsActive",
           "updatedAt" = CURRENT_TIMESTAMP`,
    [id, showAsActive]
  );
  return showAsActive;
}

export async function getEventActiveFlag(
  productId: string
): Promise<boolean | undefined> {
  const id = productId.trim();
  if (!id) return undefined;
  const result = await pool.query<{ showAsActive: boolean }>(
    `SELECT "showAsActive" FROM event_ticket_active WHERE "productId" = $1`,
    [id]
  );
  if (result.rows.length === 0) return undefined;
  return Boolean(result.rows[0].showAsActive);
}
