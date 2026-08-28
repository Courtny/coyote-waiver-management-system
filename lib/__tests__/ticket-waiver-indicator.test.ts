import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { CheckinWaiverResult } from '../checkin-person';
import { computeWaiverIndicator } from '../ticket-waiver-indicator';

function result(overrides: Partial<CheckinWaiverResult>): CheckinWaiverResult {
  return {
    status: 'not_found',
    confidence: 'not_found',
    ambiguous: false,
    ...overrides,
  };
}

describe('computeWaiverIndicator', () => {
  it('is green for exact or nickname name matches on a current-year waiver', () => {
    const indicator = computeWaiverIndicator(
      result({ status: 'active', confidence: 'name_exact' }),
      { quantity: 1, partySize: 1 }
    );
    assert.equal(indicator.level, 'green');
  });

  it('keeps fuzzy name matches yellow', () => {
    const indicator = computeWaiverIndicator(
      result({ status: 'active', confidence: 'name_fuzzy' }),
      { quantity: 1, partySize: 1 }
    );
    assert.equal(indicator.level, 'yellow');
  });

  it('stays yellow for party tickets even when the name is an exact match', () => {
    const indicator = computeWaiverIndicator(
      result({ status: 'active', confidence: 'name_exact' }),
      { quantity: 2, partySize: 1 }
    );
    assert.equal(indicator.level, 'yellow');
  });
});
