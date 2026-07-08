import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { EventAttendanceLine } from '../checkin-attendance';
import {
  attachCheckinStatus,
  countCheckedInTickets,
  lineKey,
  parseLineKey,
} from '../ticket-checkin';

function sampleLine(overrides: Partial<EventAttendanceLine> = {}): EventAttendanceLine {
  return {
    orderId: 'ord-1',
    orderedAt: '2026-01-01T12:00:00Z',
    customerName: 'Jane Doe',
    customerEmail: 'jane@example.com',
    sku: 'ticket-a',
    variantId: 'var-1',
    displayName: 'Saturday Ticket',
    quantity: 2,
    partySize: 1,
    ...overrides,
  };
}

describe('lineKey', () => {
  it('combines orderId and variantId', () => {
    assert.equal(lineKey('ord-1', 'var-1'), 'ord-1:var-1');
  });

  it('uses empty variantId when missing', () => {
    assert.equal(lineKey('ord-1', ''), 'ord-1:');
  });
});

describe('parseLineKey', () => {
  it('parses orderId and variantId', () => {
    assert.deepEqual(parseLineKey('ord-1:var-1'), { orderId: 'ord-1', variantId: 'var-1' });
  });

  it('handles missing variantId segment', () => {
    assert.deepEqual(parseLineKey('ord-1:'), { orderId: 'ord-1', variantId: '' });
  });
});

describe('attachCheckinStatus', () => {
  it('attaches checkedInUnits per line', () => {
    const lines = [
      sampleLine({ orderId: 'a', variantId: 'v1', quantity: 3 }),
      sampleLine({ orderId: 'b', variantId: 'v2', quantity: 1 }),
    ];
    const checkins = new Map<string, number[]>([
      [lineKey('a', 'v1'), [0, 2]],
      [lineKey('b', 'v2'), [0]],
    ]);

    const result = attachCheckinStatus(lines, checkins);

    assert.deepEqual(result[0].checkedInUnits, [0, 2]);
    assert.deepEqual(result[1].checkedInUnits, [0]);
  });

  it('defaults to empty checkedInUnits when no check-ins exist', () => {
    const lines = [sampleLine()];
    const result = attachCheckinStatus(lines, new Map());
    assert.deepEqual(result[0].checkedInUnits, []);
  });

  it('does not cross-contaminate lines with same orderId but different variantId', () => {
    const lines = [
      sampleLine({ variantId: 'v1', quantity: 1 }),
      sampleLine({ variantId: 'v2', quantity: 1 }),
    ];
    const checkins = new Map<string, number[]>([[lineKey('ord-1', 'v2'), [0]]]);
    const result = attachCheckinStatus(lines, checkins);

    assert.deepEqual(result[0].checkedInUnits, []);
    assert.deepEqual(result[1].checkedInUnits, [0]);
  });
});

describe('countCheckedInTickets', () => {
  it('sums checked units and total quantity', () => {
    const lines = [
      sampleLine({ quantity: 3, checkedInUnits: [0, 1] }),
      sampleLine({ orderId: 'ord-2', quantity: 2, checkedInUnits: [0, 1] }),
    ];
    assert.deepEqual(countCheckedInTickets(lines), { checkedInTotal: 4, ticketTotal: 5 });
  });

  it('treats missing checkedInUnits as zero', () => {
    const lines = [sampleLine({ quantity: 2 })];
    assert.deepEqual(countCheckedInTickets(lines), { checkedInTotal: 0, ticketTotal: 2 });
  });
});

describe('undo check-in state', () => {
  it('reflects reduced checkedInUnits after undo via attachCheckinStatus', () => {
    const lines = [sampleLine({ quantity: 3 })];
    const afterCheckin = attachCheckinStatus(
      lines,
      new Map([[lineKey('ord-1', 'var-1'), [0, 1, 2]]])
    );
    assert.deepEqual(afterCheckin[0].checkedInUnits, [0, 1, 2]);
    assert.deepEqual(countCheckedInTickets(afterCheckin), { checkedInTotal: 3, ticketTotal: 3 });

    const afterUndo = attachCheckinStatus(
      lines,
      new Map([[lineKey('ord-1', 'var-1'), [0, 2]]])
    );
    assert.deepEqual(afterUndo[0].checkedInUnits, [0, 2]);
    assert.deepEqual(countCheckedInTickets(afterUndo), { checkedInTotal: 2, ticketTotal: 3 });
  });

  it('reflects empty line after undoing all units', () => {
    const lines = [sampleLine({ quantity: 2, checkedInUnits: [0, 1] })];
    const afterUndo = attachCheckinStatus(lines, new Map());
    assert.deepEqual(afterUndo[0].checkedInUnits, []);
    assert.deepEqual(countCheckedInTickets(afterUndo), { checkedInTotal: 0, ticketTotal: 2 });
  });
});
