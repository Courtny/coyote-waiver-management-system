import { NextRequest, NextResponse } from 'next/server';
import { buildCachedAttendanceSummary } from '@/lib/attendance-summary-cached';
import { requireAdmin } from '@/lib/checkin-api';
import { getCachedCheckinOrders } from '@/lib/checkin-cache';
import { getCheckinConfig } from '@/lib/checkin-config';
import { CoyoteOpsOrdersError } from '@/lib/coyote-ops-orders';
import { getEventActiveFlags } from '@/lib/event-ticket-active';
import { WebflowOrdersError } from '@/lib/webflow-orders';

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const { events, skuDisplay } = getCheckinConfig();

  try {
    const { orders, stale, error, coyoteOpsError, newlyOrderedProductIds } =
      await getCachedCheckinOrders();
    const flags = await getEventActiveFlags();
    const { active, past, events: eventSummaries } = await buildCachedAttendanceSummary({
      orders,
      events,
      skuDisplay,
      flags,
      newlyOrderedProductIds,
    });

    return NextResponse.json({
      active,
      past,
      events: eventSummaries,
      ordersStale: stale,
      webflowError: error instanceof WebflowOrdersError ? error.message : undefined,
      coyoteOpsError,
    });
  } catch (e) {
    if (e instanceof WebflowOrdersError || e instanceof CoyoteOpsOrdersError) {
      return NextResponse.json(
        {
          error: e.message,
          code: e instanceof CoyoteOpsOrdersError ? 'coyote_ops' : 'webflow',
          active: [],
          past: [],
          events: [],
        },
        { status: e.status >= 400 && e.status < 600 ? e.status : 502 }
      );
    }
    console.error('checkin/attendance/summary:', e);
    return NextResponse.json({ error: 'Failed to load attendance summary' }, { status: 500 });
  }
}
