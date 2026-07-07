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
    <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 text-sm">
      {showMissing ? (
        <p>
          Gate / product filter is unavailable — no events are configured. Add entries to{' '}
          <code className="bg-amber-100 px-1 rounded">config/checkin-events.json</code> or set{' '}
          <code className="bg-amber-100 px-1 rounded">CHECKIN_EVENTS_JSON</code> in Vercel, then
          redeploy.
        </p>
      ) : (
        <p>{eventsConfig?.warning}</p>
      )}
      {!showMissing && (
        <p className="mt-2 text-amber-800">
          Canonical list: <code className="bg-amber-100 px-1 rounded">config/checkin-events.json</code>.
          To override via env, paste only the JSON array into the Vercel value field (not{' '}
          <code className="bg-amber-100 px-1 rounded">CHECKIN_EVENTS_JSON=...</code>), include all
          events, and redeploy.
        </p>
      )}
    </div>
  );
}
