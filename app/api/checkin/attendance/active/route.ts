import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/checkin-api';
import { setEventActiveFlag } from '@/lib/event-ticket-active';

export async function PATCH(request: NextRequest) {
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
  if (!productId) {
    return NextResponse.json({ error: 'Missing product_id' }, { status: 400 });
  }
  if (typeof data.show_as_active !== 'boolean') {
    return NextResponse.json({ error: 'Invalid show_as_active' }, { status: 400 });
  }

  try {
    const showAsActive = await setEventActiveFlag(productId, data.show_as_active);
    return NextResponse.json({ productId, showAsActive });
  } catch (e) {
    console.error('checkin/attendance/active:', e);
    return NextResponse.json({ error: 'Failed to save active flag' }, { status: 500 });
  }
}
