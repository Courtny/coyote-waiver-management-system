import { NextRequest, NextResponse } from 'next/server';
import { isCoyoteOpsConfigured, isOrdersSourceConfigured, isWebflowConfigured } from '@/lib/checkin-config';
import { requireAdmin } from '@/lib/checkin-api';
import { getCheckinEvents } from '@/lib/coyote-ops-events';

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const { events, eventsConfig } = await getCheckinEvents();
  return NextResponse.json({
    currentYear: new Date().getFullYear(),
    events,
    eventsConfig,
    webflowConfigured: isWebflowConfigured(),
    coyoteOpsConfigured: isCoyoteOpsConfigured(),
    ordersSourceConfigured: isOrdersSourceConfigured(),
  });
}
