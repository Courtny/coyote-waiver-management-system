import { NextResponse } from 'next/server';
import { getCachedWebflowOrders } from '@/lib/checkin-cache';
import { getCheckinConfig } from '@/lib/checkin-config';
import {
  aggregateOpenPlayTicketCounts,
  buildOpenPlayPublicPayload,
  getReportingWeekBounds,
} from '@/lib/open-play-counts';
import { getOpenPlayConfig, isOpenPlayConfigured } from '@/lib/open-play-config';

export const dynamic = 'force-dynamic';

export async function GET() {
  const configured = isOpenPlayConfigured();
  const bounds = getReportingWeekBounds();

  if (!configured) {
    return NextResponse.json(
      buildOpenPlayPublicPayload(
        { saturday: 0, sunday: 0 },
        bounds,
        { configured: false, ordersStale: false }
      ),
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  }

  const cfg = getOpenPlayConfig();
  const { skuPartySize } = getCheckinConfig();

  try {
    const { orders, stale } = await getCachedWebflowOrders();
    // #region agent log
    const routeDebug = {
      sessionId: '9c411d',
      hypothesisId: 'H4',
      location: 'open-play/counts/route.ts:GET',
      message: 'webflow_orders_cache',
      data: { ordersLength: orders.length, stale },
      timestamp: Date.now(),
    };
    fetch('http://127.0.0.1:7894/ingest/b643a5d8-d250-477e-88dd-d10cc6efdfdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '9c411d' },
      body: JSON.stringify(routeDebug),
    }).catch(() => {});
    console.error('[DEBUG_OPEN_PLAY]', JSON.stringify(routeDebug));
    // #endregion
    const aggregates = aggregateOpenPlayTicketCounts(orders, cfg, skuPartySize, bounds);
    const payload = buildOpenPlayPublicPayload(aggregates, bounds, { configured: true, ordersStale: stale });

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (e) {
    console.error('open-play/counts:', e);
    return NextResponse.json(
      buildOpenPlayPublicPayload(
        { saturday: 0, sunday: 0 },
        bounds,
        { configured: true, ordersStale: true }
      ),
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    );
  }
}
