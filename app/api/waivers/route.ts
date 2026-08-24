import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { Waiver, WaiverType } from '@/lib/types';

function isUnder18(yearOfBirth: string): boolean {
  const yob = Number(yearOfBirth);
  if (!Number.isFinite(yob) || yob < 1900) return false;
  return new Date().getFullYear() - yob < 18;
}

function normalizeWaiverType(value: unknown): WaiverType {
  return value === 'camping' ? 'camping' : 'field';
}

export async function POST(request: NextRequest) {
  try {
    const body: Waiver = await request.json();
    const currentYear = new Date().getFullYear();
    const waiverType = normalizeWaiverType(body.waiverType);

    if (waiverType === 'camping') {
      if (
        !body.firstName ||
        !body.lastName ||
        !body.email ||
        !body.yearOfBirth ||
        !body.phone ||
        !body.emergencyContactName ||
        !body.emergencyContactPhone ||
        !body.signature
      ) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }
      if (isUnder18(body.yearOfBirth)) {
        if (!body.guardianName?.trim() || !body.guardianSignature) {
          return NextResponse.json(
            { error: 'Parent/guardian name and signature are required for minors' },
            { status: 400 }
          );
        }
      }
    } else {
      if (
        !body.firstName ||
        !body.lastName ||
        !body.email ||
        !body.yearOfBirth ||
        !body.emergencyContactPhone ||
        !body.safetyRulesInitial ||
        !body.medicalConsentInitial ||
        !body.signature
      ) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }
    }

    const ipAddress =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const signatureDate = new Date().toISOString();

    const safetyRulesInitial =
      waiverType === 'camping' ? '' : body.safetyRulesInitial;
    const medicalConsentInitial =
      waiverType === 'camping' ? '' : body.medicalConsentInitial;
    const photoRelease = waiverType === 'camping' ? false : body.photoRelease || false;
    const minorNames = waiverType === 'camping' ? null : body.minorNames || null;
    const emergencyContactName =
      waiverType === 'camping' ? body.emergencyContactName || null : null;
    const guardianName =
      waiverType === 'camping' && isUnder18(body.yearOfBirth)
        ? body.guardianName || null
        : null;
    const guardianSignature =
      waiverType === 'camping' && isUnder18(body.yearOfBirth)
        ? body.guardianSignature || null
        : null;

    const result = await pool.query(
      `INSERT INTO waivers (
        firstname, lastname, email, yearofbirth, phone,
        emergencycontactphone, safetyrulesinitial, medicalconsentinitial,
        photorelease, minornames, signature, signaturedate,
        ipaddress, useragent, waiveryear, waivertype,
        emergencycontactname, guardianname, guardiansignature
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING id`,
      [
        body.firstName,
        body.lastName,
        body.email,
        body.yearOfBirth,
        body.phone || null,
        body.emergencyContactPhone,
        safetyRulesInitial,
        medicalConsentInitial,
        photoRelease,
        minorNames,
        body.signature,
        signatureDate,
        ipAddress,
        userAgent,
        currentYear,
        waiverType,
        emergencyContactName,
        guardianName,
        guardianSignature,
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
      const typeLabel = waiverType === 'camping' ? 'camping waiver' : 'waiver';
      const message = `New ${typeLabel} from **${body.firstName} ${body.lastName}**. [See it here](${waiverUrl})`;
      try {
        const r = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: message }),
        });
        if (!r.ok) console.error('Discord webhook non-OK:', r.status);
      } catch (err) {
        console.error('Discord webhook:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Waiver submitted successfully',
    });
  } catch (error) {
    console.error('Error submitting waiver:', error);
    return NextResponse.json(
      { error: 'Failed to submit waiver' },
      { status: 500 }
    );
  }
}
