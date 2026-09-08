import { NextRequest, NextResponse } from 'next/server';
import { buildCustomerLeaderboard } from '@/lib/customer-leaderboard';
import { requireAdmin } from '@/lib/checkin-api';
import { getCachedCheckinOrders } from '@/lib/checkin-cache';
import { CoyoteOpsOrdersError } from '@/lib/coyote-ops-orders';
import { WebflowOrdersError } from '@/lib/webflow-orders';

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const limitParam = request.nextUrl.searchParams.get('limit');
  const parsed = limitParam ? Number(limitParam) : 100;
  const limit = Number.isFinite(parsed) ? Math.min(500, Math.max(1, Math.floor(parsed))) : 100;

  try {
    const { orders, stale, error, coyoteOpsError } = await getCachedCheckinOrders();
    const customers = buildCustomerLeaderboard(orders, limit);

    return NextResponse.json({
      customers,
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
          customers: [],
        },
        { status: e.status >= 400 && e.status < 600 ? e.status : 502 }
      );
    }
    console.error('admin/customers/leaderboard:', e);
    return NextResponse.json({ error: 'Failed to load leaderboard' }, { status: 500 });
  }
}
