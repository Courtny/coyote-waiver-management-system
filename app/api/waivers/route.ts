import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { Waiver } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: Waiver = await request.json();
    const currentYear = new Date().getFullYear();

    // Validate required fields
    if (!body.firstName || !body.lastName || !body.email || !body.yearOfBirth || 
        !body.emergencyContactPhone || !body.safetyRulesInitial || 
        !body.medicalConsentInitial || !body.signature) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get IP address and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const stmt = db.prepare(`
      INSERT INTO waivers (
        firstName, lastName, email, yearOfBirth, phone,
        emergencyContactPhone, safetyRulesInitial, medicalConsentInitial,
        photoRelease, minorNames, signature, signatureDate, 
        ipAddress, userAgent, waiverYear
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const signatureDate = new Date().toISOString();
    
    stmt.run(
      body.firstName,
      body.lastName,
      body.email,
      body.yearOfBirth,
      body.phone || null,
      body.emergencyContactPhone,
      body.safetyRulesInitial,
      body.medicalConsentInitial,
      body.photoRelease ? 1 : 0,
      body.minorNames || null,
      body.signature,
      signatureDate,
      ipAddress,
      userAgent,
      currentYear
    );

    return NextResponse.json({ 
      success: true,
      message: 'Waiver submitted successfully' 
    });
  } catch (error) {
    console.error('Error submitting waiver:', error);
    return NextResponse.json(
      { error: 'Failed to submit waiver' },
      { status: 500 }
    );
  }
}
