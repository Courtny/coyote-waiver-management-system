import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
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

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

    const currentYear = new Date().getFullYear();
    const searchTerm = `%${query.trim()}%`;

    const result = await sql`
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
          WHEN waiverYear = ${currentYear} THEN 1 
          ELSE 0 
        END as hasCurrentYearWaiver
      FROM waivers
      WHERE 
        firstName LIKE ${searchTerm} OR 
        lastName LIKE ${searchTerm} OR
        (firstName || ' ' || lastName) LIKE ${searchTerm} OR
        minorNames LIKE ${searchTerm}
      ORDER BY waiverYear DESC, signatureDate DESC
      LIMIT 50
    `;

    const results = result.rows as WaiverSearchResult[];

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error searching waivers:', error);
    return NextResponse.json(
      { error: 'Failed to search waivers' },
      { status: 500 }
    );
  }
}
