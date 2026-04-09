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
