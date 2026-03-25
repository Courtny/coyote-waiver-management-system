import { NextRequest, NextResponse } from 'next/server';
import { getCheckinConfig, isWebflowConfigured } from '@/lib/checkin-config';
import { requireAdmin } from '@/lib/checkin-api';

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const { events } = getCheckinConfig();
  return NextResponse.json({
    currentYear: new Date().getFullYear(),
    events,
    webflowConfigured: isWebflowConfigured(),
  });
}
