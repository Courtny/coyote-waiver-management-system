import { NextRequest, NextResponse } from 'next/server';
import { lookupWaiverOnly } from '@/lib/checkin-person';
import { requireAdmin } from '@/lib/checkin-api';

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name : undefined;
  const email = typeof body.email === 'string' ? body.email : undefined;
  const phone = typeof body.phone === 'string' ? body.phone : undefined;

  if (!name?.trim() && !email?.trim() && !phone?.trim()) {
    return NextResponse.json(
      { error: 'Provide at least one of name, email, or phone' },
      { status: 400 }
    );
  }

  const currentYear = new Date().getFullYear();

  try {
    const waiver = await lookupWaiverOnly({ name, email, phone }, currentYear);
    return NextResponse.json({ waiver, currentYear });
  } catch (e) {
    console.error('checkin/lookup:', e);
    return NextResponse.json({ error: 'Waiver lookup failed' }, { status: 500 });
  }
}
