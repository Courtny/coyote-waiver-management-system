import fs from 'fs';
import path from 'path';

export type CheckinEventOption = { id: string; label: string; eventPatchCount?: number };

export type EventsConfigSource = 'env' | 'file' | 'none';

export type EventsConfigStatus = {
  source: EventsConfigSource;
  warning?: string;
};

export const CHECKIN_EVENTS_FILE = 'config/checkin-events.json';

function parseJsonMap(raw: string | undefined): Record<string, number> {
  if (!raw?.trim()) return {};
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(obj)) {
      const n = typeof v === 'number' ? v : Number(v);
      if (Number.isFinite(n) && n >= 1) out[k] = Math.floor(n);
    }
    return out;
  } catch {
    return {};
  }
}

function parseJsonStringMap(raw: string | undefined): Record<string, string> {
  if (!raw?.trim()) return {};
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'string' && v.trim()) out[k] = v.trim();
    }
    return out;
  } catch {
    return {};
  }
}

/** Normalize a parsed JSON value into validated event options. */
export function normalizeEventsArray(arr: unknown): CheckinEventOption[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const o = item as Record<string, unknown>;
      const id = typeof o.id === 'string' ? o.id.trim() : '';
      const label = typeof o.label === 'string' ? o.label.trim() : id;
      if (!id) return null;
      const rawPatch =
        typeof o.eventPatchCount === 'number' ? o.eventPatchCount : Number(o.eventPatchCount);
      const eventPatchCount =
        Number.isFinite(rawPatch) && rawPatch >= 1 ? Math.floor(rawPatch) : undefined;
      return { id, label, ...(eventPatchCount ? { eventPatchCount } : {}) };
    })
    .filter(Boolean) as CheckinEventOption[];
}

type EnvParseResult =
  | { ok: true; events: CheckinEventOption[] }
  | { ok: false; reason: 'missing' | 'invalid' };

function parseEventsFromEnvRaw(raw: string | undefined): EnvParseResult {
  if (raw === undefined) return { ok: false, reason: 'missing' };
  if (!raw.trim()) return { ok: false, reason: 'missing' };
  try {
    const events = normalizeEventsArray(JSON.parse(raw));
    if (events.length === 0) return { ok: false, reason: 'invalid' };
    return { ok: true, events };
  } catch {
    return { ok: false, reason: 'invalid' };
  }
}

function loadEventsFromFile(filePath?: string): CheckinEventOption[] {
  const resolved = filePath ?? path.join(process.cwd(), CHECKIN_EVENTS_FILE);
  try {
    const raw = fs.readFileSync(resolved, 'utf8');
    return normalizeEventsArray(JSON.parse(raw));
  } catch {
    return [];
  }
}

export type ResolveEventsConfigOptions = {
  envRaw?: string;
  filePath?: string;
};

/** Resolve gate/event options: env override first, then committed config file. */
export function resolveEventsConfig(
  options: ResolveEventsConfigOptions = {}
): { events: CheckinEventOption[]; eventsConfig: EventsConfigStatus } {
  const envRaw = options.envRaw ?? process.env.CHECKIN_EVENTS_JSON;
  const envResult = parseEventsFromEnvRaw(envRaw);

  if (envResult.ok) {
    return { events: envResult.events, eventsConfig: { source: 'env' } };
  }

  const fileEvents = loadEventsFromFile(options.filePath);
  if (fileEvents.length > 0) {
    const warning =
      envResult.reason === 'invalid'
        ? `CHECKIN_EVENTS_JSON is invalid; using ${CHECKIN_EVENTS_FILE}`
        : `CHECKIN_EVENTS_JSON is not set; using ${CHECKIN_EVENTS_FILE}`;
    if (envResult.reason === 'invalid') {
      console.warn(`[checkin-config] ${warning}`);
    }
    return {
      events: fileEvents,
      eventsConfig: { source: 'file', warning },
    };
  }

  const warning =
    envResult.reason === 'invalid'
      ? 'CHECKIN_EVENTS_JSON is invalid and no fallback file was found'
      : 'CHECKIN_EVENTS_JSON is not set and no fallback file was found';

  if (envResult.reason === 'invalid') {
    console.warn(`[checkin-config] ${warning}`);
  }

  return { events: [], eventsConfig: { source: 'none', warning } };
}

/** Validate normalized event options; returns human-readable errors. */
export function validateCheckinEvents(events: CheckinEventOption[]): string[] {
  const errors: string[] = [];
  if (events.length === 0) {
    errors.push('events array must not be empty');
    return errors;
  }
  const ids = new Set<string>();
  for (const [i, ev] of events.entries()) {
    if (!ev.id?.trim()) errors.push(`events[${i}]: missing id`);
    if (!ev.label?.trim()) errors.push(`events[${i}]: missing label`);
    if (ev.id && ids.has(ev.id)) errors.push(`duplicate id: ${ev.id}`);
    if (ev.id) ids.add(ev.id);
  }
  return errors;
}

function parseMoneyMinorUnitsFlag(raw: string | undefined): boolean {
  if (raw === undefined || raw === '') return true;
  const v = raw.trim().toLowerCase();
  if (v === '0' || v === 'false' || v === 'no') return false;
  return true;
}

export function getCheckinConfig() {
  const { events, eventsConfig } = resolveEventsConfig();
  return {
    webflowToken: process.env.WEBFLOW_API_TOKEN || '',
    webflowSiteId: process.env.WEBFLOW_SITE_ID || '',
    skuPartySize: parseJsonMap(process.env.CHECKIN_SKU_PARTY_SIZE),
    skuDisplay: parseJsonStringMap(process.env.CHECKIN_SKU_DISPLAY),
    events,
    eventsConfig,
    cacheTtlMs: Math.max(60_000, Number(process.env.CHECKIN_CACHE_TTL_MS) || 7 * 60_000),
    /**
     * When true (default), Webflow `value` fields without a `string` are treated as minor units
     * (e.g. cents) for currencies with 2 decimal places. Set CHECKIN_WEBFLOW_MONEY_MINOR_UNITS=0
     * if your API already returns major units as integers.
     */
    webflowMoneyMinorUnits: parseMoneyMinorUnitsFlag(process.env.CHECKIN_WEBFLOW_MONEY_MINOR_UNITS),
  };
}

export function isWebflowConfigured(): boolean {
  const c = getCheckinConfig();
  return Boolean(c.webflowToken && c.webflowSiteId);
}
