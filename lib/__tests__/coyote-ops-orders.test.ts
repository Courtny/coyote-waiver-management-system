import { describe, expect, it } from 'vitest';
import { mergeNormalizedOrders } from '../coyote-ops-orders';
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

describe('mergeNormalizedOrders', () => {
  it('dedupes by order id case-insensitively with coyote-ops winning', () => {
    const webflow = [order('abc', 'a@example.com')];
    const coyote = [order('ABC', 'b@example.com')];
    const merged = mergeNormalizedOrders(webflow, coyote);
    expect(merged).toHaveLength(1);
    expect(merged[0].customerEmail).toBe('b@example.com');
  });
});
