import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function csvCell(value: string) {
  const s = value ?? '';
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const allYears = searchParams.get('all') === '1';
    const yearParam = searchParams.get('year');
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

    if (!allYears && isNaN(year)) {
      return NextResponse.json({ error: 'Invalid year' }, { status: 400 });
    }

    const result = allYears
      ? await pool.query<{ email: string }>(
          `SELECT DISTINCT LOWER(TRIM(email)) AS email
           FROM waivers
           WHERE email IS NOT NULL AND TRIM(email) <> ''
           ORDER BY 1`
        )
      : await pool.query<{ email: string }>(
          `SELECT DISTINCT LOWER(TRIM(email)) AS email
           FROM waivers
           WHERE email IS NOT NULL AND TRIM(email) <> ''
             AND waiveryear = $1
           ORDER BY 1`,
          [year]
        );

    const rows = ['email', ...result.rows.map((r) => csvCell(r.email))];
    const csv = rows.join('\r\n');

    const filename = allYears
      ? 'waiver-emails-all-years.csv'
      : `waiver-emails-${year}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error exporting waiver emails:', error);
    return NextResponse.json(
      { error: 'Failed to export emails' },
      { status: 500 }
    );
  }
}
