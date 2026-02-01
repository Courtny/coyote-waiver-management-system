import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { WaiverSearchResult } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.cookies.get('admin_token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const currentYear = new Date().getFullYear();

    // Fetch all waivers, sorted by most recent first
    const stmt = db.prepare(`
      SELECT 
        id,
        firstName,
        lastName,
        email,
        yearOfBirth,
        signatureDate,
        waiverYear,
        minorNames,
        CASE 
          WHEN waiverYear = ? THEN 1 
          ELSE 0 
        END as hasCurrentYearWaiver
      FROM waivers
      ORDER BY signatureDate DESC
      LIMIT 200
    `);

    const results = stmt.all(currentYear) as WaiverSearchResult[];

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error fetching waivers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch waivers' },
      { status: 500 }
    );
  }
}
