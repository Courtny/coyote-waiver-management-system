import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  AIRSOFT_OPEN_PLAY_PRODUCT_ID,
  PAINTBALL_OPEN_PLAY_PRODUCT_ID,
  buildAttendanceSummaries,
  collectProductIdsFromOrders,
  mergeAttendanceSummaries,
  type EventAttendanceSummary,
} from '../checkin-attendance';
import { planWebflowOrdersSync } from '../webflow-orders-sync-plan';
import type { NormalizedOrder } from '../webflow-orders';

function orderWithProduct(
  productId: string,
  productName: string,
  orderId: string,
  qty = 1
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
        quantity: qty,
      },
    ],
  };
}

function summary(
  productId: string,
  title: string,
  totalTickets: number,
  showAsActive?: boolean
): EventAttendanceSummary {
  return {
    productId,
    title,
    orderCount: 1,
    totalTickets,
    skuBreakdown: [{ sku: 's', displayName: title, quantity: totalTickets }],
    ...(showAsActive !== undefined ? { showAsActive } : {}),
  };
}

describe('planWebflowOrdersSync', () => {
  it('pages fully when the durable cache is empty', () => {
    const plan = planWebflowOrdersSync({
      cachedOrderCount: 0,
      lastKnownTotal: 0,
      apiTotal: 250,
    });
    assert.equal(plan.fetchPage0, true);
    assert.equal(plan.continuePaging, true);
  });

  it('only refreshes page 0 when warm and total is unchanged', () => {
    const plan = planWebflowOrdersSync({
      cachedOrderCount: 250,
      lastKnownTotal: 250,
      apiTotal: 250,
    });
    assert.equal(plan.fetchPage0, true);
    assert.equal(plan.continuePaging, false);
  });

  it('continues paging when total grew', () => {
    const plan = planWebflowOrdersSync({
      cachedOrderCount: 250,
      lastKnownTotal: 250,
      apiTotal: 252,
    });
    assert.equal(plan.fetchPage0, true);
    assert.equal(plan.continuePaging, true);
  });
});

describe('collectProductIdsFromOrders', () => {
  it('collects distinct product ids from new orders', () => {
    const olderEventId = '688a250f14eccd4a64e6e7fd';
    const orders = [
      orderWithProduct(AIRSOFT_OPEN_PLAY_PRODUCT_ID, 'Open Play', 'a'),
      orderWithProduct(olderEventId, 'FTX Blockade', 'b'),
      orderWithProduct(olderEventId, 'FTX Blockade', 'c'),
    ];
    const ids = collectProductIdsFromOrders(orders);
    assert.equal(ids.size, 2);
    assert.ok(ids.has(AIRSOFT_OPEN_PLAY_PRODUCT_ID));
    assert.ok(ids.has(olderEventId));
  });
});

describe('buildAttendanceSummaries onlyProductIds', () => {
  it('aggregates only the requested product ids', () => {
    const olderEventId = '688a250f14eccd4a64e6e7fd';
    const newerEventId = '6a4d0c5f884e0f0f15dcfd74';
    const orders = [
      orderWithProduct(olderEventId, 'Blockade', 'o1', 2),
      orderWithProduct(newerEventId, 'Dead Silence', 'o2', 3),
      orderWithProduct(AIRSOFT_OPEN_PLAY_PRODUCT_ID, 'Open Play', 'o3', 1),
    ];
    const only = buildAttendanceSummaries(
      orders,
      [],
      {},
      new Set([AIRSOFT_OPEN_PLAY_PRODUCT_ID, newerEventId])
    );
    assert.deepEqual(
      only.map((s) => s.productId).sort(),
      [AIRSOFT_OPEN_PLAY_PRODUCT_ID, newerEventId].sort()
    );
    assert.equal(only.find((s) => s.productId === newerEventId)?.totalTickets, 3);
  });
});

describe('mergeAttendanceSummaries', () => {
  const olderEventId = '688a250f14eccd4a64e6e7fd';
  const newerEventId = '6a4d0c5f884e0f0f15dcfd74';

  it('serves frozen past and live active without re-freezing intact past', () => {
    const liveActive = [
      summary(AIRSOFT_OPEN_PLAY_PRODUCT_ID, 'Airsoft Open Play', 10, true),
      summary(PAINTBALL_OPEN_PLAY_PRODUCT_ID, 'Paintball Open Play', 5, true),
    ];
    const frozenPast = new Map<string, EventAttendanceSummary>([
      [olderEventId, summary(olderEventId, 'Blockade', 40)],
    ]);

    const { active, past, toFreeze } = mergeAttendanceSummaries({
      liveActive,
      frozenPast,
      pastProductIdsNeedingCompute: [],
      computedPast: [],
    });

    assert.deepEqual(
      active.map((s) => s.productId),
      [AIRSOFT_OPEN_PLAY_PRODUCT_ID, PAINTBALL_OPEN_PLAY_PRODUCT_ID]
    );
    assert.deepEqual(
      past.map((s) => s.productId),
      [olderEventId]
    );
    assert.equal(past[0].totalTickets, 40);
    assert.equal(toFreeze.length, 0);
  });

  it('freezes computed past when snapshot is missing', () => {
    const liveActive = [summary(AIRSOFT_OPEN_PLAY_PRODUCT_ID, 'Airsoft Open Play', 10, true)];
    const computed = summary(newerEventId, 'Dead Silence', 22);

    const { past, toFreeze } = mergeAttendanceSummaries({
      liveActive,
      frozenPast: new Map(),
      pastProductIdsNeedingCompute: [newerEventId],
      computedPast: [computed],
    });

    assert.equal(past.length, 1);
    assert.equal(past[0].productId, newerEventId);
    assert.equal(past[0].showAsActive, false);
    assert.equal(toFreeze.length, 1);
    assert.equal(toFreeze[0].totalTickets, 22);
  });

  it('refreshes a frozen past snapshot when that product got new orders', () => {
    const frozenPast = new Map<string, EventAttendanceSummary>([
      [olderEventId, summary(olderEventId, 'Blockade', 40)],
    ]);
    const recomputed = summary(olderEventId, 'Blockade', 45);

    const { past, toFreeze } = mergeAttendanceSummaries({
      liveActive: [],
      frozenPast,
      pastProductIdsNeedingCompute: [olderEventId],
      computedPast: [recomputed],
    });

    assert.equal(past.length, 1);
    assert.equal(past[0].totalTickets, 45);
    assert.equal(toFreeze.length, 1);
    assert.equal(toFreeze[0].totalTickets, 45);
  });
});
