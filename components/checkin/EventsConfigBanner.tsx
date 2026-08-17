import type { EventsConfigStatus } from '@/lib/checkin-config';

type EventsConfigBannerProps = {
  webflowConfigured: boolean;
  eventsCount: number;
  eventsConfig?: EventsConfigStatus;
};

export function EventsConfigBanner({
  webflowConfigured,
  eventsCount,
  eventsConfig,
}: EventsConfigBannerProps) {
  if (!webflowConfigured) return null;

  const showFallback = eventsConfig?.source === 'file';
  const showMissing = eventsCount === 0;
  const showWarning = Boolean(eventsConfig?.warning);

  if (!showFallback && !showMissing && !showWarning) return null;

  return (
    <div className="mb-6 rounded border border-status-amber/40 bg-status-amber/15 px-4 py-3 text-foreground text-sm">
      {showMissing ? (
        <p>
          Gate / product filter is unavailable — no events are configured. Add entries to{' '}
          <code className="bg-status-amber/25 px-1 rounded">config/checkin-events.json</code> or set{' '}
          <code className="bg-status-amber/25 px-1 rounded">CHECKIN_EVENTS_JSON</code> in Vercel, then
          redeploy.
        </p>
      ) : (
        <p>{eventsConfig?.warning}</p>
      )}
      {!showMissing && (
        <p className="mt-2 text-foreground">
          Canonical list: <code className="bg-status-amber/25 px-1 rounded">config/checkin-events.json</code>.
          To override via env, paste only the JSON array into the Vercel value field (not{' '}
          <code className="bg-status-amber/25 px-1 rounded">CHECKIN_EVENTS_JSON=...</code>), include all
          events, and redeploy.
        </p>
      )}
    </div>
  );
}
