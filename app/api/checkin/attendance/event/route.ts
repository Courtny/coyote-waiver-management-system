import { NextRequest, NextResponse } from 'next/server';
import { buildEventAttendanceLines, flagEventPatchRecipients, resolveEventTitle } from '@/lib/checkin-attendance';
import { enrichAttendanceLinesWithWaiverIndicators } from '@/lib/attendance-waiver-enrich';
import { requireAdmin } from '@/lib/checkin-api';
import { getCachedWebflowOrders } from '@/lib/checkin-cache';
import { getCheckinConfig } from '@/lib/checkin-config';
import { WebflowOrdersError } from '@/lib/webflow-orders';

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const productId = request.nextUrl.searchParams.get('product_id')?.trim();
  if (!productId) {
    return NextResponse.json({ error: 'Missing product_id' }, { status: 400 });
  }

  const { events, skuDisplay, skuPartySize } = getCheckinConfig();
  const currentYear = new Date().getFullYear();

  try {
    const { orders, stale, error } = await getCachedWebflowOrders();
    const rawLines = buildEventAttendanceLines(orders, productId, skuDisplay, skuPartySize);
    const lines = await enrichAttendanceLinesWithWaiverIndicators(rawLines, currentYear);
    const title = resolveEventTitle(productId, orders, events);

    const variantIds = new Set<string>();
    for (const o of orders)
      for (const l of o.lines)
        if (l.productId?.trim() === productId && l.variantId) variantIds.add(l.variantId);
    const eventCfg = events.find((e) => e.id === productId || variantIds.has(e.id));
    if (eventCfg?.eventPatchCount) {
      flagEventPatchRecipients(lines, eventCfg.eventPatchCount);
    }

    return NextResponse.json({
      productId,
      title,
      lines,
      ordersStale: stale,
      webflowError: error?.message,
    });
  } catch (e) {
    if (e instanceof WebflowOrdersError) {
      return NextResponse.json(
        { error: e.message, code: 'webflow', lines: [] },
        { status: e.status >= 400 && e.status < 600 ? e.status : 502 }
      );
    }
    console.error('checkin/attendance/event:', e);
    return NextResponse.json({ error: 'Failed to load event lines' }, { status: 500 });
  }
}
