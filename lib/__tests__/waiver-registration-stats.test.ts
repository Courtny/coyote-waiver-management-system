import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildEtDateSeries,
  deriveRegistrationKpis,
  zeroFillDailyCounts,
} from '../waiver-registration-stats';

describe('buildEtDateSeries', () => {
  it('returns 30 consecutive ET dates ending on the reference day', () => {
    const dates = buildEtDateSeries(30, new Date('2026-08-17T20:00:00Z'));
    assert.equal(dates.length, 30);
    assert.equal(dates[0], '2026-07-19');
    assert.equal(dates[29], '2026-08-17');
  });
});

describe('zeroFillDailyCounts', () => {
  it('fills missing days with zero', () => {
    const dates = ['2026-08-15', '2026-08-16', '2026-08-17'];
    const daily = zeroFillDailyCounts(dates, [
      { date: '2026-08-15', currentYear: 1, priorYears: 1 },
      { date: '2026-08-17', currentYear: 4, priorYears: 1 },
    ]);

    assert.deepEqual(daily, [
      { date: '2026-08-15', currentYear: 1, priorYears: 1, count: 2 },
      { date: '2026-08-16', currentYear: 0, priorYears: 0, count: 0 },
      { date: '2026-08-17', currentYear: 4, priorYears: 1, count: 5 },
    ]);
  });
});

describe('deriveRegistrationKpis', () => {
  it('sums today, last 7 days, and last 30 days from the daily series', () => {
    const daily = Array.from({ length: 30 }, (_, index) => {
      const count = index < 23 ? 1 : index === 29 ? 4 : 2;
      return {
        date: `2026-07-${String(index + 1).padStart(2, '0')}`,
        currentYear: count,
        priorYears: 0,
        count,
      };
    });

    const kpis = deriveRegistrationKpis(daily);
    assert.equal(kpis.today, 4);
    assert.equal(kpis.last7Days, 16);
    assert.equal(kpis.last30Days, 39);
  });

  it('returns zeros for an empty series', () => {
    assert.deepEqual(deriveRegistrationKpis([]), {
      today: 0,
      last7Days: 0,
      last30Days: 0,
    });
  });
});
