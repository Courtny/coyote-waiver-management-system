'use client';

import { useEffect, useState } from 'react';
import { Loader2, Users } from 'lucide-react';

type Payload = {
  configured: boolean;
  weekLabel: string;
  saturdayDisplay: string;
  sundayDisplay: string;
  ordersStale: boolean;
};

export function OpenPlayWeekendCounts() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch('/api/open-play/counts');
        if (!res.ok) {
          if (!cancelled) setError('Could not load ticket counts.');
          return;
        }
        const json = (await res.json()) as Payload;
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch {
        if (!cancelled) setError('Could not load ticket counts.');
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return null;
  }

  if (!data) {
    return (
      <div
        className="mt-6 flex justify-center items-center gap-2 text-gray-500 text-sm"
        aria-busy="true"
        aria-live="polite"
      >
        <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
        <span>Loading weekend sign-ups…</span>
      </div>
    );
  }

  if (!data.configured) {
    return null;
  }

  return (
    <div className="mt-6 pt-6 border-t border-gray-200/80 text-left w-full max-w-md mx-auto">
      <div className="flex items-center gap-2 text-gray-800 font-semibold text-sm mb-2">
        <Users className="h-4 w-4 shrink-0 text-coyote-600" aria-hidden />
        <span>Airsoft Open Play — this week</span>
      </div>
      <p className="text-xs text-gray-500 mb-3">{data.weekLabel} (Eastern)</p>
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 text-sm">
        <div className="rounded-lg bg-gray-50 px-4 py-3 border border-gray-100">
          <div className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">Saturday</div>
          <div className="text-2xl font-bold text-gray-900 tabular-nums">{data.saturdayDisplay}</div>
        </div>
        <div className="rounded-lg bg-gray-50 px-4 py-3 border border-gray-100">
          <div className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">Sunday</div>
          <div className="text-2xl font-bold text-gray-900 tabular-nums">{data.sundayDisplay}</div>
        </div>
      </div>
      <p className="mt-3 text-xs text-gray-500">
        Ticket holders this week (updates periodically). Counts of 1 or 2 are shown as &quot;Under 3&quot;
        for privacy.
      </p>
      {data.ordersStale && (
        <p className="mt-1 text-xs text-amber-700">Using last known totals; refresh may be delayed.</p>
      )}
    </div>
  );
}
