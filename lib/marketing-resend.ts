import { Resend } from 'resend';

const DELAY_MS = 150;
const WAIVER_SOURCE = 'waiver';

export type UpsertContactInput = {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
};

export type UpsertContactResult = 'created' | 'updated' | 'skipped' | 'failed';

export type SyncMarketingConfig = {
  apiKey: string;
  audienceId: string;
};

/** Merge additive source tags (e.g. booking + waiver → booking+waiver). */
export function mergeSourceProperty(
  existing: string | null | undefined,
  add: string
): string {
  const sources = new Set(
    (existing ?? '')
      .split('+')
      .map((part) => part.trim())
      .filter(Boolean)
  );
  sources.add(add);
  return [...sources].sort().join('+');
}

export function normalizeMarketingEmail(
  raw: string | undefined | null
): string | null {
  const email = raw?.trim().toLowerCase();
  if (!email || !email.includes('@')) return null;
  return email;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readSourceFromProperties(
  properties: Record<string, unknown> | null | undefined
): string | undefined {
  if (!properties || typeof properties !== 'object') return undefined;
  const raw = properties.source;
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object' && 'value' in raw) {
    const value = (raw as { value?: unknown }).value;
    return typeof value === 'string' ? value : undefined;
  }
  return undefined;
}

export function getMarketingConfig(): SyncMarketingConfig | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const audienceId = process.env.RESEND_AUDIENCE_ID?.trim();
  if (!apiKey || !audienceId) return null;
  return { apiKey, audienceId };
}

/**
 * Upsert a waiver signer into the Resend marketing segment.
 * Fail-open: returns 'failed' / 'skipped' instead of throwing.
 */
export async function upsertWaiverMarketingContact(
  client: Resend,
  audienceId: string,
  input: UpsertContactInput
): Promise<UpsertContactResult> {
  const email = normalizeMarketingEmail(input.email);
  if (!email) return 'skipped';

  const firstName = input.firstName?.trim() || undefined;
  const lastName = input.lastName?.trim() || undefined;

  try {
    const createResult = await client.contacts.create({
      audienceId,
      email,
      firstName,
      lastName,
      unsubscribed: false,
      properties: { source: WAIVER_SOURCE },
    });

    if (!createResult.error) return 'created';

    const existing = await client.contacts.get({ audienceId, email });
    const existingSource = readSourceFromProperties(
      (existing.data as { properties?: Record<string, unknown> } | null)
        ?.properties
    );
    const source = mergeSourceProperty(existingSource, WAIVER_SOURCE);

    const updateResult = await client.contacts.update({
      audienceId,
      email,
      firstName: firstName ?? null,
      lastName: lastName ?? null,
      unsubscribed: false,
      properties: { source },
    });

    if (updateResult.error) {
      console.warn('[marketing] Resend update failed', {
        error: updateResult.error,
      });
      return 'failed';
    }
    return 'updated';
  } catch (error) {
    console.warn('[marketing] Resend upsert failed', { error });
    return 'failed';
  }
}

export type SyncBatchResult = {
  scanned: number;
  created: number;
  updated: number;
  failed: number;
  skipped: number;
};

export async function syncWaiverContactsToResend(
  contacts: UpsertContactInput[],
  config: SyncMarketingConfig
): Promise<SyncBatchResult> {
  const client = new Resend(config.apiKey);
  const result: SyncBatchResult = {
    scanned: contacts.length,
    created: 0,
    updated: 0,
    failed: 0,
    skipped: 0,
  };

  for (let i = 0; i < contacts.length; i += 1) {
    const status = await upsertWaiverMarketingContact(
      client,
      config.audienceId,
      contacts[i]
    );
    if (status === 'created') result.created += 1;
    else if (status === 'updated') result.updated += 1;
    else if (status === 'failed') result.failed += 1;
    else result.skipped += 1;

    if (i < contacts.length - 1) await sleep(DELAY_MS);
  }

  return result;
}

/** Verify Vercel Cron / manual curl Authorization: Bearer <CRON_SECRET>. */
export function authorizeCronRequest(
  authHeader: string | null,
  secret: string | undefined = process.env.CRON_SECRET
): boolean {
  if (!secret) return false;
  if (!authHeader) return false;
  const [scheme, token] = authHeader.split(/\s+/, 2);
  if (scheme?.toLowerCase() !== 'bearer' || !token) return false;
  return token === secret;
}

export function parseLookbackDays(
  raw: string | null,
  defaultDays = 8,
  maxDays = 90
): number {
  if (raw == null || raw === '') return defaultDays;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return defaultDays;
  return Math.min(parsed, maxDays);
}
