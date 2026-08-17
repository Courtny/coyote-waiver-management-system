import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { pool } from '@/lib/db';
import { getWaiverRegistrationStats } from '@/lib/waiver-registration-stats';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const stats = await getWaiverRegistrationStats(pool);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching waiver registration stats:', error);
    return NextResponse.json({ error: 'Failed to fetch waiver registration stats' }, { status: 500 });
  }
}
