import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mergeCheckinEvents, parseCoyoteOpsEvents } from '../coyote-ops-events';

describe('parseCoyoteOpsEvents', () => {
  it('reads id, label, and event date from the coyote-ops events list', () => {
    const events = parseCoyoteOpsEvents({
      events: [
        {
          id: 'fcfbe6f7-e4dd-4ef8-86c5-49b5cdba523a',
          slug: 'airsoft-ftx-s2e9',
          label: 'Airsoft FTX: Broken Line',
          eventDate: '2026-11-28',
          isActive: true,
          soldOut: false,
        },
        { slug: 'missing-id' },
      ],
    });
    assert.deepEqual(events, [
      {
        id: 'fcfbe6f7-e4dd-4ef8-86c5-49b5cdba523a',
        label: 'Airsoft FTX: Broken Line',
        eventDate: '2026-11-28',
      },
    ]);
  });

  it('returns nothing for an unexpected payload', () => {
    assert.deepEqual(parseCoyoteOpsEvents(null), []);
    assert.deepEqual(parseCoyoteOpsEvents({ orders: [] }), []);
  });
});

describe('mergeCheckinEvents', () => {
  it('adds new store events ahead of config and keeps config labels and patch counts', () => {
    const merged = mergeCheckinEvents(
      [
        { id: '6a9ddc3e212a5c6a80e695a8', label: 'Airsoft FTX: Migration', eventPatchCount: 40 },
        { id: '66a2a82ee43b0a9a111c999c', label: 'Coyote Airsoft - Open Play' },
      ],
      [
        { id: 'fcfbe6f7-e4dd-4ef8-86c5-49b5cdba523a', label: 'Airsoft FTX: Broken Line', eventDate: '2026-11-28' },
        { id: '6a9ddc3e212a5c6a80e695a8', label: 'Airsoft FTX: Migration (store name)', eventDate: '2026-09-26' },
      ]
    );
    assert.deepEqual(merged, [
      { id: 'fcfbe6f7-e4dd-4ef8-86c5-49b5cdba523a', label: 'Airsoft FTX: Broken Line', eventDate: '2026-11-28' },
      {
        id: '6a9ddc3e212a5c6a80e695a8',
        label: 'Airsoft FTX: Migration',
        eventPatchCount: 40,
        eventDate: '2026-09-26',
      },
      { id: '66a2a82ee43b0a9a111c999c', label: 'Coyote Airsoft - Open Play' },
    ]);
  });
});
