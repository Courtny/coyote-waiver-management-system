import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/checkin-api';
import { markTicketCheckedIn } from '@/lib/ticket-checkin';

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const productId = typeof data.product_id === 'string' ? data.product_id.trim() : '';
  const orderId = typeof data.order_id === 'string' ? data.order_id.trim() : '';
  const variantId = typeof data.variant_id === 'string' ? data.variant_id.trim() : '';
  const unitIndex = data.unit_index;

  if (!productId || !orderId) {
    return NextResponse.json({ error: 'Missing product_id or order_id' }, { status: 400 });
  }
  if (typeof unitIndex !== 'number' || !Number.isInteger(unitIndex) || unitIndex < 0) {
    return NextResponse.json({ error: 'Invalid unit_index' }, { status: 400 });
  }

  try {
    const checkedInUnits = await markTicketCheckedIn({
      productId,
      orderId,
      variantId,
      unitIndex,
    });
    return NextResponse.json({ checkedInUnits });
  } catch (e) {
    console.error('checkin/attendance/checkin:', e);
    return NextResponse.json({ error: 'Failed to record check-in' }, { status: 500 });
  }
}
