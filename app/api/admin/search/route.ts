import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
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
    const searchQuery = query.trim();
    const searchTerm = `%${searchQuery}%`;

    const result = await pool.query(
      `SELECT 
        id,
        firstname as "firstName",
        lastname as "lastName",
        email,
        yearofbirth as "yearOfBirth",
        signaturedate as "signatureDate",
        waiveryear as "waiverYear",
        minornames as "minorNames",
        CASE 
          WHEN waiveryear = $1 THEN 1 
          ELSE 0 
        END as "hasCurrentYearWaiver",
        GREATEST(
          COALESCE(similarity(firstname, $2), 0),
          COALESCE(similarity(lastname, $2), 0),
          COALESCE(similarity(firstname || ' ' || lastname, $2), 0),
          COALESCE(similarity(COALESCE(minornames, ''), $2), 0),
          CASE WHEN yearofbirth ILIKE $3 THEN 1.0 ELSE 0 END
        ) as relevance
      FROM waivers
      WHERE 
        (similarity(firstname, $2) > 0.3 OR firstname ILIKE $3) OR
        (similarity(lastname, $2) > 0.3 OR lastname ILIKE $3) OR
        (similarity(firstname || ' ' || lastname, $2) > 0.3 OR (firstname || ' ' || lastname) ILIKE $3) OR
        (yearofbirth ILIKE $3) OR
        (minornames IS NOT NULL AND (similarity(minornames, $2) > 0.3 OR minornames ILIKE $3))
      ORDER BY 
        relevance DESC,
        waiveryear DESC, 
        signaturedate DESC
      LIMIT 50`,
      [currentYear, searchQuery, searchTerm]
    );

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
