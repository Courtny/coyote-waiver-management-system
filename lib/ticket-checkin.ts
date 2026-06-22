import type { EventAttendanceLine } from './checkin-attendance';
import { pool } from './db';

export type TicketLineKey = {
  orderId: string;
  variantId: string;
};

export function lineKey(orderId: string, variantId: string): string {
  return `${orderId}:${variantId || ''}`;
}

export function parseLineKey(key: string): TicketLineKey {
  const sep = key.indexOf(':');
  if (sep === -1) return { orderId: key, variantId: '' };
  return { orderId: key.slice(0, sep), variantId: key.slice(sep + 1) };
}

/** Load all check-ins for a product, keyed by `${orderId}:${variantId}`. */
export async function getCheckinsForProduct(productId: string): Promise<Map<string, number[]>> {
  const result = await pool.query<{ orderId: string; variantId: string; unitIndex: number }>(
    `SELECT "orderId", "variantId", "unitIndex"
     FROM ticket_checkins
     WHERE "productId" = $1
     ORDER BY "orderId", "variantId", "unitIndex"`,
    [productId.trim()]
  );

  const map = new Map<string, number[]>();
  for (const row of result.rows) {
    const key = lineKey(row.orderId, row.variantId);
    const prev = map.get(key);
    if (prev) prev.push(row.unitIndex);
    else map.set(key, [row.unitIndex]);
  }
  return map;
}

export function attachCheckinStatus(
  lines: EventAttendanceLine[],
  checkins: Map<string, number[]>
): EventAttendanceLine[] {
  return lines.map((line) => {
    const units = checkins.get(lineKey(line.orderId, line.variantId)) ?? [];
    return {
      ...line,
      checkedInUnits: [...units].sort((a, b) => a - b),
    };
  });
}

export function countCheckedInTickets(lines: EventAttendanceLine[]): {
  checkedInTotal: number;
  ticketTotal: number;
} {
  let checkedInTotal = 0;
  let ticketTotal = 0;
  for (const line of lines) {
    ticketTotal += line.quantity;
    checkedInTotal += line.checkedInUnits?.length ?? 0;
  }
  return { checkedInTotal, ticketTotal };
}

export async function markTicketCheckedIn(params: {
  productId: string;
  orderId: string;
  variantId: string;
  unitIndex: number;
}): Promise<number[]> {
  const productId = params.productId.trim();
  const orderId = params.orderId.trim();
  const variantId = params.variantId?.trim() ?? '';

  if (!productId || !orderId) {
    throw new Error('Missing productId or orderId');
  }
  if (!Number.isInteger(params.unitIndex) || params.unitIndex < 0) {
    throw new Error('Invalid unitIndex');
  }

  await pool.query(
    `INSERT INTO ticket_checkins ("productId", "orderId", "variantId", "unitIndex")
     VALUES ($1, $2, $3, $4)
     ON CONFLICT ("productId", "orderId", "variantId", "unitIndex") DO NOTHING`,
    [productId, orderId, variantId, params.unitIndex]
  );

  const result = await pool.query<{ unitIndex: number }>(
    `SELECT "unitIndex" FROM ticket_checkins
     WHERE "productId" = $1 AND "orderId" = $2 AND "variantId" = $3
     ORDER BY "unitIndex"`,
    [productId, orderId, variantId]
  );

  return result.rows.map((r) => r.unitIndex);
}
