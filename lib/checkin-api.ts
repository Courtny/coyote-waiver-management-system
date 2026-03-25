import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './auth';

export function requireAdmin(request: NextRequest): NextResponse | null {
  const token = request.cookies.get('admin_token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const decoded = verifyToken(token);
  if (!decoded) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
  return null;
}
