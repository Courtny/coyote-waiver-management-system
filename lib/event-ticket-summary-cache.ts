import { pool } from './db';
import type { EventAttendanceSummary } from './checkin-attendance';

function asSummary(raw: unknown): EventAttendanceSummary | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as Record<string, unknown>;
  if (typeof s.productId !== 'string' || typeof s.title !== 'string') return null;
  if (typeof s.orderCount !== 'number' || typeof s.totalTickets !== 'number') return null;
  if (!Array.isArray(s.skuBreakdown)) return null;
  return raw as EventAttendanceSummary;
}

export async function getAllFrozenSummaries(): Promise<Map<string, EventAttendanceSummary>> {
  const result = await pool.query<{ productId: string; summary: unknown }>(
    `SELECT "productId", summary FROM event_ticket_summary_cache`
  );
  const map = new Map<string, EventAttendanceSummary>();
  for (const row of result.rows) {
    const summary = asSummary(row.summary);
    if (summary) {
      map.set(row.productId, { ...summary, productId: row.productId });
    }
  }
  return map;
}

export async function getFrozenSummary(
  productId: string
): Promise<EventAttendanceSummary | undefined> {
  const id = productId.trim();
  if (!id) return undefined;
  const result = await pool.query<{ summary: unknown }>(
    `SELECT summary FROM event_ticket_summary_cache WHERE "productId" = $1`,
    [id]
  );
  if (result.rows.length === 0) return undefined;
  const summary = asSummary(result.rows[0].summary);
  return summary ? { ...summary, productId: id } : undefined;
}

export async function upsertFrozenSummary(summary: EventAttendanceSummary): Promise<void> {
  const id = summary.productId.trim();
  if (!id) return;
  const toStore: EventAttendanceSummary = {
    ...summary,
    productId: id,
    showAsActive: false,
  };
  await pool.query(
    `INSERT INTO event_ticket_summary_cache ("productId", summary, "frozenAt")
     VALUES ($1, $2::jsonb, CURRENT_TIMESTAMP)
     ON CONFLICT ("productId") DO UPDATE
       SET summary = EXCLUDED.summary,
           "frozenAt" = CURRENT_TIMESTAMP`,
    [id, JSON.stringify(toStore)]
  );
}

export async function upsertFrozenSummaries(summaries: EventAttendanceSummary[]): Promise<void> {
  for (const s of summaries) {
    await upsertFrozenSummary(s);
  }
}

export async function deleteFrozenSummary(productId: string): Promise<void> {
  const id = productId.trim();
  if (!id) return;
  await pool.query(`DELETE FROM event_ticket_summary_cache WHERE "productId" = $1`, [id]);
}
