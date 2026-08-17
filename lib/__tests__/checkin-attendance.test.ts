import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  AIRSOFT_OPEN_PLAY_PRODUCT_ID,
  DEFAULT_FTX_STX_PATCH_COUNT,
  PAINTBALL_OPEN_PLAY_PRODUCT_ID,
  buildAttendanceSummaries,
  compareAttendanceSummaries,
  flagEventPatchRecipients,
  isFtxOrStxEventTitle,
  openPlayPinRank,
  productIdCreatedAtMs,
  resolveEventPatchCount,
  applyActiveFlags,
  defaultShowAsActive,
  resolveShowAsActive,
  splitAttendanceSummaries,
} from '../checkin-attendance';
import type { EventAttendanceLine } from '../checkin-attendance';
import type { NormalizedOrder } from '../webflow-orders';

function orderWithProduct(
  productId: string,
  productName: string,
  orderId = `ord-${productId.slice(0, 6)}`
): NormalizedOrder {
  return {
    orderId,
    acceptedOn: '2026-01-01T12:00:00Z',
    customerEmail: 'test@example.com',
    customerFullName: 'Test User',
    billingAddressee: 'Test User',
    customerPaidAmount: 50,
    lines: [
      {
        productId,
        productName,
        variantId: `var-${productId.slice(0, 6)}`,
        sku: `sku-${productId.slice(0, 6)}`,
        displayName: productName,
        quantity: 1,
      },
    ],
  };
}

describe('productIdCreatedAtMs', () => {
  it('parses ObjectId creation time from the first 8 hex chars', () => {
    // 0x66a2a82e seconds since epoch
    assert.equal(productIdCreatedAtMs(AIRSOFT_OPEN_PLAY_PRODUCT_ID), 0x66a2a82e * 1000);
  });

  it('returns 0 for non-ObjectId strings', () => {
    assert.equal(productIdCreatedAtMs('not-an-id'), 0);
    assert.equal(productIdCreatedAtMs(''), 0);
  });
});

describe('openPlayPinRank', () => {
  it('pins airsoft and paintball by product id', () => {
    assert.equal(openPlayPinRank({ productId: AIRSOFT_OPEN_PLAY_PRODUCT_ID, title: 'x' }), 0);
    assert.equal(openPlayPinRank({ productId: PAINTBALL_OPEN_PLAY_PRODUCT_ID, title: 'x' }), 1);
  });

  it('pins by title when product id differs', () => {
    assert.equal(
      openPlayPinRank({ productId: 'aaaaaaaaaaaaaaaaaaaaaaaa', title: 'Coyote Airsoft - Open Play' }),
      0
    );
    assert.equal(
      openPlayPinRank({ productId: 'bbbbbbbbbbbbbbbbbbbbbbbb', title: 'Coyote Paintball - Open Play' }),
      1
    );
  });

  it('returns 2 for non-open-play events', () => {
    assert.equal(openPlayPinRank({ productId: '6a4d0c5f884e0f0f15dcfd74', title: 'Airsoft FTX: Dead Silence' }), 2);
  });
});

describe('compareAttendanceSummaries', () => {
  it('orders airsoft open play before paintball before others', () => {
    const airsoft = { productId: AIRSOFT_OPEN_PLAY_PRODUCT_ID, title: 'Coyote Airsoft - Open Play' };
    const paintball = { productId: PAINTBALL_OPEN_PLAY_PRODUCT_ID, title: 'Coyote Paintball - Open Play' };
    const other = { productId: '6a4d0c5f884e0f0f15dcfd74', title: 'Airsoft FTX: Dead Silence' };
    assert.ok(compareAttendanceSummaries(airsoft, paintball) < 0);
    assert.ok(compareAttendanceSummaries(paintball, other) < 0);
    assert.ok(compareAttendanceSummaries(airsoft, other) < 0);
  });

  it('orders non-pinned events newest ObjectId first', () => {
    const newer = { productId: '6a4d0c5f884e0f0f15dcfd74', title: 'Dead Silence' };
    const older = { productId: '688a250f14eccd4a64e6e7fd', title: 'Blockade' };
    assert.ok(compareAttendanceSummaries(newer, older) < 0);
    assert.ok(compareAttendanceSummaries(older, newer) > 0);
  });
});

describe('buildAttendanceSummaries sort order', () => {
  it('puts airsoft open play first, paintball second, then newest other events', () => {
    const olderEventId = '688a250f14eccd4a64e6e7fd';
    const newerEventId = '6a4d0c5f884e0f0f15dcfd74';
    const orders = [
      orderWithProduct(olderEventId, 'Airsoft FTX: Blockade'),
      orderWithProduct(newerEventId, 'Airsoft FTX: Dead Silence'),
      orderWithProduct(PAINTBALL_OPEN_PLAY_PRODUCT_ID, 'Coyote Paintball - Open Play'),
      orderWithProduct(AIRSOFT_OPEN_PLAY_PRODUCT_ID, 'Coyote Airsoft - Open Play'),
    ];

    const summaries = buildAttendanceSummaries(orders, [], {});
    assert.deepEqual(
      summaries.map((s) => s.productId),
      [AIRSOFT_OPEN_PLAY_PRODUCT_ID, PAINTBALL_OPEN_PLAY_PRODUCT_ID, newerEventId, olderEventId]
    );
  });

  it('sorts remaining events newest to oldest when open play products are missing', () => {
    const olderEventId = '688a250f14eccd4a64e6e7fd';
    const midEventId = '697d5949b017e784aac457f2';
    const newerEventId = '6a4d0c5f884e0f0f15dcfd74';
    const orders = [
      orderWithProduct(olderEventId, 'Airsoft FTX: Blockade'),
      orderWithProduct(newerEventId, 'Airsoft FTX: Dead Silence'),
      orderWithProduct(midEventId, 'Airsoft FTX: Heist'),
    ];

    const summaries = buildAttendanceSummaries(orders, [], {});
    assert.deepEqual(
      summaries.map((s) => s.productId),
      [newerEventId, midEventId, olderEventId]
    );
  });

  it('pins open play by title when product ids differ from known constants', () => {
    const airsoftAlt = 'aaaaaaaaaaaaaaaaaaaaaaaa';
    const paintballAlt = 'bbbbbbbbbbbbbbbbbbbbbbbb';
    const other = '6a4d0c5f884e0f0f15dcfd74';
    const orders = [
      orderWithProduct(other, 'Airsoft FTX: Dead Silence'),
      orderWithProduct(paintballAlt, 'Coyote Paintball - Open Play'),
      orderWithProduct(airsoftAlt, 'Coyote Airsoft - Open Play'),
    ];

    const summaries = buildAttendanceSummaries(orders, [], {});
    assert.deepEqual(
      summaries.map((s) => s.productId),
      [airsoftAlt, paintballAlt, other]
    );
  });
});

describe('isFtxOrStxEventTitle', () => {
  it('matches FTX and STX titles', () => {
    assert.equal(isFtxOrStxEventTitle('Airsoft FTX: Dead Silence'), true);
    assert.equal(isFtxOrStxEventTitle('Paintball STX: Discovery'), true);
    assert.equal(isFtxOrStxEventTitle('Coyote Airsoft FTX'), true);
  });

  it('rejects Open Play, Magfed, and unrelated titles', () => {
    assert.equal(isFtxOrStxEventTitle('Coyote Airsoft - Open Play'), false);
    assert.equal(isFtxOrStxEventTitle('Coyote Magfed Meet Ticket'), false);
    assert.equal(isFtxOrStxEventTitle('Contact: LADOGA'), false);
  });
});

describe('resolveEventPatchCount', () => {
  it('returns default 40 for FTX/STX titles without config', () => {
    assert.equal(resolveEventPatchCount('Airsoft FTX: Ambush'), DEFAULT_FTX_STX_PATCH_COUNT);
    assert.equal(resolveEventPatchCount('Paintball STX: Discovery'), 40);
  });

  it('returns config override when set', () => {
    assert.equal(resolveEventPatchCount('Airsoft FTX: Heist', { eventPatchCount: 25 }), 25);
  });

  it('returns undefined for non-FTX/STX without config', () => {
    assert.equal(resolveEventPatchCount('Coyote Airsoft - Open Play'), undefined);
    assert.equal(resolveEventPatchCount('Contact: LADOGA'), undefined);
  });
});

describe('flagEventPatchRecipients', () => {
  it('marks the earliest N lines by order date', () => {
    const lines: EventAttendanceLine[] = [
      {
        orderId: 'c',
        orderedAt: '2026-03-01T12:00:00Z',
        customerName: 'C',
        customerEmail: 'c@example.com',
        sku: 's',
        variantId: 'v',
        displayName: 'Ticket',
        quantity: 1,
        partySize: 1,
      },
      {
        orderId: 'a',
        orderedAt: '2026-01-01T12:00:00Z',
        customerName: 'A',
        customerEmail: 'a@example.com',
        sku: 's',
        variantId: 'v',
        displayName: 'Ticket',
        quantity: 1,
        partySize: 1,
      },
      {
        orderId: 'b',
        orderedAt: '2026-02-01T12:00:00Z',
        customerName: 'B',
        customerEmail: 'b@example.com',
        sku: 's',
        variantId: 'v',
        displayName: 'Ticket',
        quantity: 1,
        partySize: 1,
      },
    ];
    flagEventPatchRecipients(lines, 2);
    assert.equal(lines.find((l) => l.orderId === 'a')?.receivesEventPatch, true);
    assert.equal(lines.find((l) => l.orderId === 'b')?.receivesEventPatch, true);
    assert.equal(lines.find((l) => l.orderId === 'c')?.receivesEventPatch, undefined);
  });
});

describe('resolveShowAsActive', () => {
  const airsoft = { productId: AIRSOFT_OPEN_PLAY_PRODUCT_ID, title: 'Coyote Airsoft - Open Play' };
  const paintball = { productId: PAINTBALL_OPEN_PLAY_PRODUCT_ID, title: 'Coyote Paintball - Open Play' };
  const ftx = { productId: '6a4d0c5f884e0f0f15dcfd74', title: 'Airsoft FTX: Dead Silence' };

  it('defaults Open Play to active and other events to past', () => {
    assert.equal(defaultShowAsActive(airsoft), true);
    assert.equal(defaultShowAsActive(paintball), true);
    assert.equal(defaultShowAsActive(ftx), false);
    assert.equal(resolveShowAsActive(airsoft, new Map()), true);
    assert.equal(resolveShowAsActive(ftx, new Map()), false);
  });

  it('lets a stored flag override the default', () => {
    assert.equal(resolveShowAsActive(airsoft, new Map([[AIRSOFT_OPEN_PLAY_PRODUCT_ID, false]])), false);
    assert.equal(resolveShowAsActive(ftx, new Map([['6a4d0c5f884e0f0f15dcfd74', true]])), true);
  });
});

describe('splitAttendanceSummaries', () => {
  it('splits flagged summaries into active and past while preserving order', () => {
    const olderEventId = '688a250f14eccd4a64e6e7fd';
    const newerEventId = '6a4d0c5f884e0f0f15dcfd74';
    const orders = [
      orderWithProduct(olderEventId, 'Airsoft FTX: Blockade'),
      orderWithProduct(newerEventId, 'Airsoft FTX: Dead Silence'),
      orderWithProduct(PAINTBALL_OPEN_PLAY_PRODUCT_ID, 'Coyote Paintball - Open Play'),
      orderWithProduct(AIRSOFT_OPEN_PLAY_PRODUCT_ID, 'Coyote Airsoft - Open Play'),
    ];
    const flags = new Map<string, boolean>([[newerEventId, true]]);
    const summaries = applyActiveFlags(buildAttendanceSummaries(orders, [], {}), flags);
    const { active, past } = splitAttendanceSummaries(summaries);

    assert.deepEqual(
      active.map((s) => s.productId),
      [AIRSOFT_OPEN_PLAY_PRODUCT_ID, PAINTBALL_OPEN_PLAY_PRODUCT_ID, newerEventId]
    );
    assert.deepEqual(
      past.map((s) => s.productId),
      [olderEventId]
    );
  });
});
