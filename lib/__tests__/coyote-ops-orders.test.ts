import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  mergeNormalizedOrders,
  nextCoyoteOpsListOffset,
  normalizeCoyoteOpsOrder,
  type CoyoteOpsCheckInOrder,
} from '../coyote-ops-orders';
import type { NormalizedOrder } from '../webflow-orders';

function order(id: string, email: string): NormalizedOrder {
  return {
    orderId: id,
    acceptedOn: '2026-09-01T12:00:00.000Z',
    customerEmail: email,
    customerFullName: 'Test',
    billingAddressee: 'Test',
    customerPaidAmount: 0,
    lines: [
      {
        productId: 'prod',
        productName: 'Ticket',
        variantId: 'var',
        sku: 'sku',
        displayName: 'Ticket',
        quantity: 1,
      },
    ],
  };
}

const coyoteOrder: CoyoteOpsCheckInOrder = {
  code: 'ST-123456',
  status: 'paid',
  contact: { name: 'Ada', email: 'ada@example.com' },
  lines: [
    {
      sku: 'open-play-saturday',
      name: 'Open Play — Saturday',
      quantity: 2,
      faction: null,
      productId: '66a2a82ee43b0a9a111c999c',
      variantId: 'var-sat',
      imageUrl: 'https://cdn.example/open-play.jpg',
    },
  ],
  paidAt: '2026-09-06T15:00:00.000Z',
  createdAt: '2026-09-06T14:59:00.000Z',
  totalPaidCents: 4500,
  source: 'web',
};

describe('mergeNormalizedOrders', () => {
  it('dedupes by order id case-insensitively with coyote-ops winning', () => {
    const webflow = [order('abc', 'a@example.com')];
    const coyote = [order('ABC', 'b@example.com')];
    const merged = mergeNormalizedOrders(webflow, coyote);
    assert.equal(merged.length, 1);
    assert.equal(merged[0].customerEmail, 'b@example.com');
  });
});

describe('normalizeCoyoteOpsOrder', () => {
  it('maps list fields used by ticket counts (product id, image, paid amount)', () => {
    const n = normalizeCoyoteOpsOrder(coyoteOrder);
    assert.equal(n.orderId, 'ST-123456');
    assert.equal(n.acceptedOn, '2026-09-06T15:00:00.000Z');
    assert.equal(n.customerPaidAmount, 45);
    assert.equal(n.lines[0].productId, '66a2a82ee43b0a9a111c999c');
    assert.equal(n.lines[0].imageUrl, 'https://cdn.example/open-play.jpg');
    assert.equal(n.lines[0].quantity, 2);
  });

  it('falls back to createdAt when paidAt is null', () => {
    const n = normalizeCoyoteOpsOrder({ ...coyoteOrder, paidAt: null, status: 'pending' });
    assert.equal(n.acceptedOn, '2026-09-06T14:59:00.000Z');
  });
});

describe('nextCoyoteOpsListOffset', () => {
  it('advances while a full page remains', () => {
    assert.equal(nextCoyoteOpsListOffset(0, 100, 100, 250), 100);
    assert.equal(nextCoyoteOpsListOffset(100, 100, 100, 250), 200);
  });

  it('stops on a short page or when total is reached', () => {
    assert.equal(nextCoyoteOpsListOffset(200, 100, 50, 250), null);
    assert.equal(nextCoyoteOpsListOffset(200, 100, 100, 250), null);
  });
});
