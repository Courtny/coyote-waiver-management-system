import { NextRequest, NextResponse } from 'next/server';
import { buildSingleProductSummary } from '@/lib/attendance-summary-cached';
import { requireAdmin } from '@/lib/checkin-api';
import { getCachedWebflowOrders } from '@/lib/checkin-cache';
import { getCheckinConfig } from '@/lib/checkin-config';
import { setEventActiveFlag } from '@/lib/event-ticket-active';
import {
  deleteFrozenSummary,
  upsertFrozenSummary,
} from '@/lib/event-ticket-summary-cache';

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

    if (showAsActive) {
      // Past → Active: drop freeze so next summary recounts live
      await deleteFrozenSummary(productId);
    } else {
      // Active → Past: snapshot current counts from cached orders
      const { events, skuDisplay } = getCheckinConfig();
      const { orders } = await getCachedWebflowOrders();
      const snapshot = buildSingleProductSummary(orders, productId, events, skuDisplay);
      if (snapshot) {
        await upsertFrozenSummary(snapshot);
      }
    }

    return NextResponse.json({ productId, showAsActive });
  } catch (e) {
    console.error('checkin/attendance/active:', e);
    return NextResponse.json({ error: 'Failed to save active flag' }, { status: 500 });
  }
}
