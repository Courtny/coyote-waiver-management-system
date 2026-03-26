import { NextRequest, NextResponse } from 'next/server';
import { getCachedWebflowOrders } from '@/lib/checkin-cache';
import { resolveCheckinPerson } from '@/lib/checkin-person';
import { requireAdmin } from '@/lib/checkin-api';
import { WebflowOrdersError } from '@/lib/webflow-orders';

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name : undefined;
  const email = typeof body.email === 'string' ? body.email : undefined;
  const phone = typeof body.phone === 'string' ? body.phone : undefined;
  const event_id = typeof body.event_id === 'string' ? body.event_id : undefined;
  const order_id = typeof body.order_id === 'string' ? body.order_id : undefined;

  if (!name?.trim() && !email?.trim() && !phone?.trim() && !order_id?.trim()) {
    return NextResponse.json(
      { error: 'Provide at least one of name, email, phone, or order_id' },
      { status: 400 }
    );
  }

  const currentYear = new Date().getFullYear();

  try {
    const { orders, stale, error } = await getCachedWebflowOrders();
    const result = await resolveCheckinPerson(
      { name, email, phone, eventId: event_id, orderId: order_id },
      orders,
      currentYear
    );

    if (result.orderNotFound) {
      return NextResponse.json(
        {
          error: 'No order with that ID in the cached Webflow orders',
          code: 'order_not_found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...result,
      ordersStale: stale,
      webflowError: error?.message,
      currentYear,
    });
  } catch (e) {
    if (e instanceof WebflowOrdersError) {
      return NextResponse.json(
        { error: e.message, code: 'webflow', status: e.status },
        { status: e.status >= 400 && e.status < 600 ? e.status : 502 }
      );
    }
    console.error('checkin/person:', e);
    return NextResponse.json({ error: 'Check-in lookup failed' }, { status: 500 });
  }
}
