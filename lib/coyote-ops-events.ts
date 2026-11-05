import {
  getCheckinConfig,
  isCoyoteOpsConfigured,
  normalizeEventsArray,
  resolveEventsConfig,
  type CheckinEventOption,
  type EventsConfigStatus,
} from './checkin-config';

let memory: { events: CheckinEventOption[]; fetchedAt: number } | null = null;

/** Parse `GET /api/check-in/events` from coyote-ops into gate event options. */
export function parseCoyoteOpsEvents(data: unknown): CheckinEventOption[] {
  if (!data || typeof data !== 'object') return [];
  const events = (data as Record<string, unknown>).events;
  return normalizeEventsArray(events);
}

/**
 * Committed config entries keep their label and patch count; store events fill in
 * missing dates and add anything not configured yet (newest first, ahead of config).
 */
export function mergeCheckinEvents(
  configured: CheckinEventOption[],
  store: CheckinEventOption[]
): CheckinEventOption[] {
  const storeById = new Map(store.map((event) => [event.id, event]));
  const configuredIds = new Set(configured.map((event) => event.id));
  const merged = configured.map((event) => {
    const fromStore = storeById.get(event.id);
    return fromStore?.eventDate && !event.eventDate
      ? { ...event, eventDate: fromStore.eventDate }
      : event;
  });
  const added = store.filter((event) => !configuredIds.has(event.id));
  return [...added, ...merged];
}

/** Store event list, cached like orders. Fails soft so check-in still works on config alone. */
export async function fetchCoyoteOpsEvents(): Promise<CheckinEventOption[]> {
  if (!isCoyoteOpsConfigured()) return [];
  const { coyoteOpsOrdersBaseUrl, coyoteOpsCheckinSecret, cacheTtlMs } = getCheckinConfig();
  const now = Date.now();
  if (memory && now - memory.fetchedAt < cacheTtlMs) return memory.events;

  try {
    const res = await fetch(new URL('/api/check-in/events', coyoteOpsOrdersBaseUrl).toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${coyoteOpsCheckinSecret}`,
      },
      cache: 'no-store',
    });
    if (!res.ok) {
      console.warn(`[coyote-ops-events] events list failed (${res.status})`);
      return memory?.events ?? [];
    }
    const events = parseCoyoteOpsEvents(await res.json());
    memory = { events, fetchedAt: now };
    return events;
  } catch (e) {
    console.warn('[coyote-ops-events] events list unavailable:', e);
    return memory?.events ?? [];
  }
}

/** Gate / ticket-count events: committed config merged with live store events. */
export async function getCheckinEvents(): Promise<{
  events: CheckinEventOption[];
  eventsConfig: EventsConfigStatus;
}> {
  const { events, eventsConfig } = resolveEventsConfig();
  const store = await fetchCoyoteOpsEvents();
  return { events: mergeCheckinEvents(events, store), eventsConfig };
}
