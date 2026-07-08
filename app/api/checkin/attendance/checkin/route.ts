import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/checkin-api';
import { markTicketCheckedIn, unmarkTicketCheckedIn } from '@/lib/ticket-checkin';

function parseCheckinBody(body: unknown):
  | { ok: true; productId: string; orderId: string; variantId: string; unitIndex: number }
  | { ok: false; response: NextResponse } {
  const data = body as Record<string, unknown>;
  const productId = typeof data.product_id === 'string' ? data.product_id.trim() : '';
  const orderId = typeof data.order_id === 'string' ? data.order_id.trim() : '';
  const variantId = typeof data.variant_id === 'string' ? data.variant_id.trim() : '';
  const unitIndex = data.unit_index;

  if (!productId || !orderId) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Missing product_id or order_id' }, { status: 400 }),
    };
  }
  if (typeof unitIndex !== 'number' || !Number.isInteger(unitIndex) || unitIndex < 0) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Invalid unit_index' }, { status: 400 }),
    };
  }

  return { ok: true, productId, orderId, variantId, unitIndex };
}

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = parseCheckinBody(body);
  if (!parsed.ok) return parsed.response;

  try {
    const checkedInUnits = await markTicketCheckedIn(parsed);
    return NextResponse.json({ checkedInUnits });
  } catch (e) {
    console.error('checkin/attendance/checkin:', e);
    return NextResponse.json({ error: 'Failed to record check-in' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = parseCheckinBody(body);
  if (!parsed.ok) return parsed.response;

  try {
    const checkedInUnits = await unmarkTicketCheckedIn(parsed);
    return NextResponse.json({ checkedInUnits });
  } catch (e) {
    console.error('checkin/attendance/checkin DELETE:', e);
    return NextResponse.json({ error: 'Failed to undo check-in' }, { status: 500 });
  }
}
