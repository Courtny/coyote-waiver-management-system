import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
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

    const signatureDate = new Date().toISOString();

    const result = await pool.query(
      `INSERT INTO waivers (
        firstname, lastname, email, yearofbirth, phone,
        emergencycontactphone, safetyrulesinitial, medicalconsentinitial,
        photorelease, minornames, signature, signaturedate, 
        ipaddress, useragent, waiveryear
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id`,
      [
        body.firstName,
        body.lastName,
        body.email,
        body.yearOfBirth,
        body.phone || null,
        body.emergencyContactPhone,
        body.safetyRulesInitial,
        body.medicalConsentInitial,
        body.photoRelease || false,
        body.minorNames || null,
        body.signature,
        signatureDate,
        ipAddress,
        userAgent,
        currentYear
      ]
    );

    const newId = result.rows[0]?.id as number | undefined;
    const webhookUrl = process.env.DISCORD_WAIVER_WEBHOOK_URL;
    const baseUrl = (
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
    ).replace(/\/$/, '');

    if (webhookUrl && baseUrl && newId != null) {
      const waiverUrl = `${baseUrl}/admin/waivers/${newId}`;
      const message = `New waiver from **${body.firstName} ${body.lastName}**. [See it here](${waiverUrl})`;
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message }),
      }).catch((err) => console.error('Discord webhook:', err));
    }

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
