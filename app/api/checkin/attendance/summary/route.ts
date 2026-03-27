import { NextRequest, NextResponse } from 'next/server';
import { buildAttendanceSummaries } from '@/lib/checkin-attendance';
import { requireAdmin } from '@/lib/checkin-api';
import { getCachedWebflowOrders } from '@/lib/checkin-cache';
import { getCheckinConfig } from '@/lib/checkin-config';
import { WebflowOrdersError } from '@/lib/webflow-orders';

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const { events, skuDisplay, productSkuAllowlist } = getCheckinConfig();

  // #region agent log
  try {
    const raw = process.env.CHECKIN_PRODUCT_SKU_ALLOWLIST_JSON;
    const payload = {
      sessionId: '0dcbc7',
      runId: 'attendance-summary',
      hypothesisId: 'H1-H3',
      location: 'attendance/summary/route.ts:GET',
      message: 'CHECKIN_PRODUCT_SKU_ALLOWLIST_JSON parse result',
      data: {
        envVarPresent: Boolean(raw?.trim()),
        envVarLength: raw?.length ?? 0,
        parsedKeyCount: Object.keys(productSkuAllowlist).length,
        parsedKeys: Object.keys(productSkuAllowlist),
        skuCountPerKey: Object.fromEntries(
          Object.entries(productSkuAllowlist).map(([k, v]) => [k, v.length])
        ),
        skuDisplayOverrideCount: Object.keys(skuDisplay).length,
      },
      timestamp: Date.now(),
    };
    console.log('[debug-0dcbc7]', JSON.stringify(payload));
    fetch('http://127.0.0.1:7243/ingest/b643a5d8-d250-477e-88dd-d10cc6efdfdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '0dcbc7' },
      body: JSON.stringify(payload),
    }).catch(() => {});
  } catch {
    /* ignore debug */
  }
  // #endregion

  try {
    const { orders, stale, error } = await getCachedWebflowOrders();
    const eventSummaries = buildAttendanceSummaries(orders, events, skuDisplay, productSkuAllowlist);

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
