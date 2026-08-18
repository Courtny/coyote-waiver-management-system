import { addDays, subDays } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import type { Pool } from 'pg';
import type { WaiverSearchResult } from '@/lib/types';

export const REGISTRATION_STATS_DAYS = 30;
export const LATEST_WAIVERS_LIMIT = 8;

const ET = 'America/New_York';

export type DailyRegistrationCount = {
  date: string;
  currentYear: number;
  priorYears: number;
  count: number;
};

export type WaiverRegistrationStats = {
  today: number;
  last7Days: number;
  last30Days: number;
  daily: DailyRegistrationCount[];
  latest: WaiverSearchResult[];
};

/** Last N ET calendar days ending today, inclusive (YYYY-MM-DD). */
export function buildEtDateSeries(days: number, now: Date = new Date()): string[] {
  const zonedNow = toZonedTime(now, ET);
  const start = subDays(zonedNow, days - 1);
  return Array.from({ length: days }, (_, i) =>
    formatInTimeZone(addDays(start, i), ET, 'yyyy-MM-dd')
  );
}

export function zeroFillDailyCounts(
  dates: string[],
  rows: { date: string; currentYear: number; priorYears: number }[]
): DailyRegistrationCount[] {
  const byDate = new Map(rows.map((row) => [row.date, row]));
  return dates.map((date) => {
    const row = byDate.get(date);
    const currentYear = row?.currentYear ?? 0;
    const priorYears = row?.priorYears ?? 0;
    return {
      date,
      currentYear,
      priorYears,
      count: currentYear + priorYears,
    };
  });
}

export function deriveRegistrationKpis(daily: DailyRegistrationCount[]): {
  today: number;
  last7Days: number;
  last30Days: number;
} {
  const last30Days = daily.reduce((sum, entry) => sum + entry.count, 0);
  const last7Days = daily.slice(-7).reduce((sum, entry) => sum + entry.count, 0);
  const today = daily.length > 0 ? daily[daily.length - 1].count : 0;
  return { today, last7Days, last30Days };
}

export async function getWaiverRegistrationStats(
  pool: Pool,
  now: Date = new Date()
): Promise<WaiverRegistrationStats> {
  const dates = buildEtDateSeries(REGISTRATION_STATS_DAYS, now);
  const startDate = dates[0];
  const currentYear = formatInTimeZone(now, ET, 'yyyy');

  const [dailyResult, latestResult] = await Promise.all([
    pool.query<{ date: string; currentYear: number; priorYears: number }>(
      `SELECT
        to_char((signaturedate::timestamptz AT TIME ZONE 'America/New_York'), 'YYYY-MM-DD') AS date,
        COUNT(*) FILTER (WHERE waiveryear = $2)::int AS "currentYear",
        COUNT(*) FILTER (WHERE waiveryear <> $2)::int AS "priorYears"
      FROM waivers
      WHERE (signaturedate::timestamptz AT TIME ZONE 'America/New_York')::date >= $1::date
      GROUP BY date
      ORDER BY date`,
      [startDate, Number(currentYear)]
    ),
    pool.query(
      `SELECT
        id,
        firstname AS "firstName",
        lastname AS "lastName",
        email,
        yearofbirth AS "yearOfBirth",
        signaturedate AS "signatureDate",
        waiveryear AS "waiverYear",
        minornames AS "minorNames",
        CASE
          WHEN waiveryear = $1 THEN 1
          ELSE 0
        END AS "hasCurrentYearWaiver"
      FROM waivers
      ORDER BY signaturedate DESC
      LIMIT $2`,
      [Number(currentYear), LATEST_WAIVERS_LIMIT]
    ),
  ]);

  const daily = zeroFillDailyCounts(
    dates,
    dailyResult.rows.map((row) => ({
      date: row.date,
      currentYear: Number(row.currentYear),
      priorYears: Number(row.priorYears),
    }))
  );
  const kpis = deriveRegistrationKpis(daily);

  return {
    ...kpis,
    daily,
    latest: latestResult.rows as WaiverSearchResult[],
  };
}
