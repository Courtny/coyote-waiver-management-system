import { getCheckinConfig } from './checkin-config';
import type { NormalizedOrder } from './webflow-orders';
import {
  findWaiversByEmail,
  findWaiversByNameFuzzy,
  findWaiversByPhone,
  normalizeEmail,
  normalizePhoneDigits,
  pickBestWaiverYear,
  type WaiverConfidence,
  type WaiverRow,
} from './waiver-checkin-lookup';

export type CheckinWaiverResult = {
  status: 'active' | 'expired' | 'not_found';
  confidence: WaiverConfidence;
  ambiguous: boolean;
  candidates?: Array<{ id: number; firstName: string; lastName: string; email: string }>;
  waiver?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    waiverYear: number;
    signatureDate: string;
  };
};

export type CheckinPurchaseLine = {
  sku: string;
  displayName: string;
  quantity: number;
  productId: string;
  variantId: string;
  partySize: number;
  imageUrl?: string;
};

export type CheckinPurchaseOrder = {
  orderId: string;
  orderedAt: string | null;
  lines: CheckinPurchaseLine[];
};

export type ResolvePersonInput = {
  name?: string;
  email?: string;
  phone?: string;
  eventId?: string;
};

function tokenSet(name: string): Set<string> {
  return new Set(
    name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 0)
  );
}

export function namesLikelyMatch(a: string, b: string): boolean {
  const A = tokenSet(a);
  const B = tokenSet(b);
  if (A.size === 0 || B.size === 0) return false;
  let inter = 0;
  for (const t of A) {
    if (B.has(t)) inter++;
  }
  const union = A.size + B.size - inter;
  const jaccard = union > 0 ? inter / union : 0;
  if (jaccard >= 0.5) return true;
  const al = a.toLowerCase().trim();
  const bl = b.toLowerCase().trim();
  return al.length >= 3 && bl.length >= 3 && (al.includes(bl) || bl.includes(al));
}

function lineMatchesEvent(line: { productId: string; variantId: string }, eventId: string): boolean {
  if (!eventId) return true;
  return line.productId === eventId || line.variantId === eventId;
}

function enrichLines(
  lines: NormalizedOrder['lines'],
  eventId: string | undefined,
  skuParty: Record<string, number>,
  skuDisplay: Record<string, string>
): CheckinPurchaseLine[] {
  const out: CheckinPurchaseLine[] = [];
  for (const L of lines) {
    if (eventId && !lineMatchesEvent(L, eventId)) continue;
    const partySize = skuParty[L.sku] ?? 1;
    const displayName = skuDisplay[L.sku] || L.displayName;
    out.push({
      sku: L.sku,
      displayName,
      quantity: L.quantity,
      productId: L.productId,
      variantId: L.variantId,
      partySize,
      ...(L.imageUrl ? { imageUrl: L.imageUrl } : {}),
    });
  }
  return out;
}

function orderMatchesCustomer(
  o: NormalizedOrder,
  opts: { email?: string; name?: string }
): boolean {
  if (opts.email && o.customerEmail && normalizeEmail(opts.email) === o.customerEmail) return true;
  if (opts.name && namesLikelyMatch(opts.name, o.customerFullName)) return true;
  if (opts.name && namesLikelyMatch(opts.name, o.billingAddressee)) return true;
  return false;
}

async function resolveWaiver(
  input: ResolvePersonInput,
  currentYear: number
): Promise<CheckinWaiverResult> {
  const email = input.email?.trim();
  const phone = input.phone?.trim();
  const name = input.name?.trim();

  if (email) {
    const rows = await findWaiversByEmail(email);
    const best = pickBestWaiverYear(rows, currentYear);
    if (best) {
      return {
        status: best.waiverYear === currentYear ? 'active' : 'expired',
        confidence: 'email_match',
        ambiguous: false,
        waiver: {
          id: best.id,
          firstName: best.firstName,
          lastName: best.lastName,
          email: best.email,
          phone: best.phone,
          waiverYear: best.waiverYear,
          signatureDate: best.signatureDate,
        },
      };
    }
    return { status: 'not_found', confidence: 'not_found', ambiguous: false };
  }

  if (phone && normalizePhoneDigits(phone).length >= 7) {
    const rows = await findWaiversByPhone(phone);
    if (rows.length > 1) {
      return {
        status: 'not_found',
        confidence: 'not_found',
        ambiguous: true,
        candidates: rows.slice(0, 8).map((r) => ({
          id: r.id,
          firstName: r.firstName,
          lastName: r.lastName,
          email: r.email,
        })),
      };
    }
    const best = pickBestWaiverYear(rows, currentYear);
    if (best) {
      return {
        status: best.waiverYear === currentYear ? 'active' : 'expired',
        confidence: 'phone_match',
        ambiguous: false,
        waiver: {
          id: best.id,
          firstName: best.firstName,
          lastName: best.lastName,
          email: best.email,
          phone: best.phone,
          waiverYear: best.waiverYear,
          signatureDate: best.signatureDate,
        },
      };
    }
  }

  if (name && name.length >= 2) {
    const fuzzy = await findWaiversByNameFuzzy(name, 8);
    if (fuzzy.length === 0) {
      /* fall through */
    } else if (fuzzy.length === 1) {
      const best = pickBestWaiverYear([fuzzy[0]], currentYear);
      if (best) {
        return {
          status: best.waiverYear === currentYear ? 'active' : 'expired',
          confidence: 'name_fuzzy',
          ambiguous: false,
          waiver: {
            id: best.id,
            firstName: best.firstName,
            lastName: best.lastName,
            email: best.email,
            phone: best.phone,
            waiverYear: best.waiverYear,
            signatureDate: best.signatureDate,
          },
        };
      }
    } else {
      const top = fuzzy[0].relevance;
      const tied = fuzzy.filter((r) => r.relevance >= top - 0.04 && r.relevance >= 0.3);
      if (tied.length > 1) {
        return {
          status: 'not_found',
          confidence: 'not_found',
          ambiguous: true,
          candidates: tied.slice(0, 8).map((r) => ({
            id: r.id,
            firstName: r.firstName,
            lastName: r.lastName,
            email: r.email,
          })),
        };
      }
      const bestRow = fuzzy[0];
      const best = pickBestWaiverYear([bestRow], currentYear);
      if (best) {
        return {
          status: best.waiverYear === currentYear ? 'active' : 'expired',
          confidence: 'name_fuzzy',
          ambiguous: false,
          waiver: {
            id: best.id,
            firstName: best.firstName,
            lastName: best.lastName,
            email: best.email,
            phone: best.phone,
            waiverYear: best.waiverYear,
            signatureDate: best.signatureDate,
          },
        };
      }
    }
  }

  return { status: 'not_found', confidence: 'not_found', ambiguous: false };
}

export async function resolveCheckinPerson(
  input: ResolvePersonInput,
  orders: NormalizedOrder[],
  currentYear: number
): Promise<{ waiver: CheckinWaiverResult; purchases: CheckinPurchaseOrder[]; ordersStale?: boolean }> {
  const { skuPartySize, skuDisplay } = getCheckinConfig();
  const eventId = input.eventId?.trim() || undefined;

  const waiver = await resolveWaiver(input, currentYear);

  const emailKey =
    input.email?.trim() ||
    (waiver.waiver?.email ? waiver.waiver.email : undefined);
  const nameKey = input.name?.trim();

  const matchedOrders = orders.filter((o) =>
    orderMatchesCustomer(o, {
      email: emailKey,
      name: nameKey,
    })
  );

  const purchaseOrders: CheckinPurchaseOrder[] = matchedOrders
    .map((o) => {
      const lines = enrichLines(o.lines, eventId, skuPartySize, skuDisplay);
      if (lines.length === 0) return null;
      return {
        orderId: o.orderId,
        orderedAt: o.acceptedOn,
        lines,
      };
    })
    .filter(Boolean) as CheckinPurchaseOrder[];

  purchaseOrders.sort((a, b) => {
    const ta = a.orderedAt ? Date.parse(a.orderedAt) : 0;
    const tb = b.orderedAt ? Date.parse(b.orderedAt) : 0;
    return tb - ta;
  });

  return { waiver, purchases: purchaseOrders };
}

/** Resolve waiver only (party row / lookup endpoint) — email → phone → name fuzzy */
export async function lookupWaiverOnly(
  input: { name?: string; email?: string; phone?: string },
  currentYear: number
): Promise<CheckinWaiverResult> {
  return resolveWaiver(input, currentYear);
}
