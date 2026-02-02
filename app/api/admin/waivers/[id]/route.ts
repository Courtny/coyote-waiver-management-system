import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const waiverId = parseInt(params.id);
    if (isNaN(waiverId)) {
      return NextResponse.json(
        { error: 'Invalid waiver ID' },
        { status: 400 }
      );
    }

    // Fetch single waiver by ID
    const result = await pool.query(
      `SELECT 
        id,
        firstName,
        lastName,
        email,
        yearOfBirth,
        phone,
        emergencyContactPhone,
        safetyRulesInitial,
        medicalConsentInitial,
        photoRelease,
        minorNames,
        signature,
        signatureDate,
        waiverYear,
        createdAt,
        ipAddress,
        userAgent
      FROM waivers
      WHERE id = $1`,
      [waiverId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Waiver not found' },
        { status: 404 }
      );
    }

    const waiver = result.rows[0] as any;
    
    // Ensure photoRelease is boolean (PostgreSQL returns it as boolean, but ensure type safety)
    waiver.photoRelease = Boolean(waiver.photoRelease);

    return NextResponse.json({ waiver });
  } catch (error) {
    console.error('Error fetching waiver:', error);
    return NextResponse.json(
      { error: 'Failed to fetch waiver' },
      { status: 500 }
    );
  }
}
