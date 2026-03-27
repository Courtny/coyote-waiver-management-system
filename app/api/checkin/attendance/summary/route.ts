import { NextRequest, NextResponse } from 'next/server';
import { buildAttendanceSummaries } from '@/lib/checkin-attendance';
import { requireAdmin } from '@/lib/checkin-api';
import { getCachedWebflowOrders } from '@/lib/checkin-cache';
import { getCheckinConfig } from '@/lib/checkin-config';
import { WebflowOrdersError } from '@/lib/webflow-orders';

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const { events, skuDisplay } = getCheckinConfig();

  try {
    const { orders, stale, error } = await getCachedWebflowOrders();
    const eventSummaries = buildAttendanceSummaries(orders, events, skuDisplay);

    return NextResponse.json({
      events: eventSummaries,
      ordersStale: stale,
      webflowError: error?.message,
    });
  } catch (e) {
    if (e instanceof WebflowOrdersError) {
      return NextResponse.json(
        { error: e.message, code: 'webflow', events: [] },
        { status: e.status >= 400 && e.status < 600 ? e.status : 502 }
      );
    }
    console.error('checkin/attendance/summary:', e);
    return NextResponse.json({ error: 'Failed to load attendance summary' }, { status: 500 });
  }
}
