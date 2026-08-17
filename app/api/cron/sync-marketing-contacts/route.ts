import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import {
  authorizeCronRequest,
  getMarketingConfig,
  parseLookbackDays,
  syncWaiverContactsToResend,
} from '@/lib/marketing-resend';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type WaiverContactRow = {
  email: string;
  firstName: string | null;
  lastName: string | null;
};

export async function GET(request: NextRequest) {
  try {
    if (!authorizeCronRequest(request.headers.get('authorization'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = getMarketingConfig();
    if (!config) {
      return NextResponse.json({
        skipped: true,
        reason: 'RESEND_API_KEY or RESEND_AUDIENCE_ID unset',
      });
    }

    const days = parseLookbackDays(
      request.nextUrl.searchParams.get('days')
    );
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - days);
    const sinceIso = since.toISOString();

    const query = await pool.query<WaiverContactRow>(
      `SELECT DISTINCT ON (LOWER(TRIM(email)))
         LOWER(TRIM(email)) AS email,
         firstname AS "firstName",
         lastname AS "lastName"
       FROM waivers
       WHERE email IS NOT NULL AND TRIM(email) <> ''
         AND signaturedate >= $1
       ORDER BY LOWER(TRIM(email)), signaturedate DESC`,
      [sinceIso]
    );

    const sync = await syncWaiverContactsToResend(query.rows, config);

    return NextResponse.json({
      lookbackDays: days,
      since: sinceIso,
      ...sync,
    });
  } catch (error) {
    console.error('[marketing] sync-marketing-contacts failed', error);
    return NextResponse.json(
      { error: 'Failed to sync marketing contacts' },
      { status: 500 }
    );
  }
}
