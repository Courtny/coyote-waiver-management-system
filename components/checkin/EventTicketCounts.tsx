'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight, Loader2, RefreshCw, Users } from 'lucide-react';

type SkuBreakdownRow = {
  sku: string;
  displayName: string;
  quantity: number;
  imageUrl?: string;
};

type EventAttendanceSummary = {
  productId: string;
  title: string;
  orderCount: number;
  totalTickets: number;
  skuBreakdown: SkuBreakdownRow[];
  imageUrl?: string;
};

type EventAttendanceLine = {
  orderId: string;
  orderedAt: string | null;
  customerName: string;
  customerEmail: string;
  sku: string;
  displayName: string;
  quantity: number;
  imageUrl?: string;
};

function formatOrderDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

type EventDetailPanelProps = {
  detail: { productId: string; title: string; lines: EventAttendanceLine[] };
  detailLoading: boolean;
  ordersStale: boolean;
  webflowError?: string;
  onBack: () => void;
};

function EventDetailPanel({
  detail,
  detailLoading,
  ordersStale,
  webflowError,
  onBack,
}: EventDetailPanelProps) {
  const [includedSkus, setIncludedSkus] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (detailLoading) return;
    setIncludedSkus(new Set(detail.lines.map((l) => l.sku || '')));
  }, [detail.productId, detailLoading, detail.lines]);

  const skuOptions = useMemo(() => {
    if (!detail.lines.length) return [] as { skuKey: string; displayName: string }[];
    const map = new Map<string, string>();
    for (const row of detail.lines) {
      const k = row.sku || '';
      if (!map.has(k)) map.set(k, row.displayName);
    }
    return Array.from(map.entries())
      .map(([skuKey, displayName]) => ({ skuKey, displayName }))
      .sort((a, b) =>
        a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' })
      );
  }, [detail.lines]);

  const filteredLines = useMemo(
    () => detail.lines.filter((row) => includedSkus.has(row.sku || '')),
    [detail.lines, includedSkus]
  );

  const ticketSum = filteredLines.reduce((s, r) => s + r.quantity, 0);

  const toggleSku = (skuKey: string) => {
    setIncludedSkus((prev) => {
      const next = new Set(prev);
      if (next.has(skuKey)) next.delete(skuKey);
      else next.add(skuKey);
      return next;
    });
  };

  const selectAllSkus = () => {
    setIncludedSkus(new Set(skuOptions.map((o) => o.skuKey)));
  };

  const clearAllSkus = () => {
    setIncludedSkus(new Set());
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
      >
        <ArrowLeft size={16} />
        Back to event list
      </button>

      {ordersStale && webflowError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 text-sm">
          Showing cached orders; refresh failed: {webflowError}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-900">{detail.title}</h2>
        <p className="text-sm text-gray-600">
          {filteredLines.length} line{filteredLines.length !== 1 ? 's' : ''} · {ticketSum} tickets
          {filteredLines.length !== detail.lines.length ? (
            <span className="text-gray-500"> (of {detail.lines.length} lines)</span>
          ) : null}
        </p>
      </div>

      {detailLoading ? (
        <div className="flex justify-center py-16 text-gray-500">
          <Loader2 className="animate-spin" size={32} />
        </div>
      ) : (
        <>
          {skuOptions.length > 1 ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50/80 px-4 py-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                <p className="text-sm font-medium text-gray-800">Filter by ticket / SKU</p>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <button type="button" className="btn btn-secondary text-xs py-1.5 px-2" onClick={selectAllSkus}>
                    Select all
                  </button>
                  <button type="button" className="btn btn-secondary text-xs py-1.5 px-2" onClick={clearAllSkus}>
                    Clear
                  </button>
                </div>
              </div>
              <ul className="flex flex-wrap gap-x-4 gap-y-2">
                {skuOptions.map((opt) => (
                  <li key={opt.skuKey || '__empty__'}>
                    <label className="inline-flex items-start gap-2 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        className="mt-0.5 rounded border-gray-300"
                        checked={includedSkus.has(opt.skuKey)}
                        onChange={() => toggleSku(opt.skuKey)}
                      />
                      <span>
                        <span className="font-medium text-gray-900">{opt.displayName}</span>
                        {opt.skuKey ? (
                          <span className="block text-xs text-gray-500 font-mono mt-0.5">{opt.skuKey}</span>
                        ) : (
                          <span className="block text-xs text-gray-500 mt-0.5">(no SKU)</span>
                        )}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="px-4 py-3 text-left text-gray-700 font-semibold w-14" scope="col">
                    <span className="sr-only">Image</span>
                  </th>
                  <th className="px-4 py-3 text-left text-gray-700 font-semibold">SKU / ticket</th>
                  <th className="px-4 py-3 text-left text-gray-700 font-semibold">Customer</th>
                  <th className="px-4 py-3 text-left text-gray-700 font-semibold">Email</th>
                  <th className="px-4 py-3 text-left text-gray-700 font-semibold text-right">Qty</th>
                  <th className="px-4 py-3 text-left text-gray-700 font-semibold">Order</th>
                  <th className="px-4 py-3 text-left text-gray-700 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {detail.lines.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-600">
                      No line items for this product in cached orders.
                    </td>
                  </tr>
                ) : includedSkus.size === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-600">
                      No tickets / SKUs selected — choose at least one filter above or use Select all.
                    </td>
                  </tr>
                ) : (
                  filteredLines.map((row, i) => (
                    <tr
                      key={`${row.orderId}-${row.sku}-${i}`}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 align-middle">
                        {row.imageUrl ? (
                          <img
                            src={row.imageUrl}
                            alt={row.displayName}
                            className="h-10 w-10 rounded-md object-cover border border-gray-200 bg-white"
                          />
                        ) : (
                          <div
                            className="h-10 w-10 rounded-md border border-dashed border-gray-200 bg-gray-50"
                            aria-hidden
                          />
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        <div className="text-gray-900">{row.displayName}</div>
                        {row.sku && (
                          <div className="text-xs text-gray-500 font-mono mt-0.5">{row.sku}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{row.customerName}</td>
                      <td className="px-4 py-3 text-gray-600 break-all max-w-[200px]">{row.customerEmail}</td>
                      <td className="px-4 py-3 text-right text-gray-600 font-medium">{row.quantity}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{row.orderId}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatOrderDate(row.orderedAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}



export function EventTicketCounts({ webflowConfigured }: { webflowConfigured: boolean }) {
  const router = useRouter();
  const [events, setEvents] = useState<EventAttendanceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ordersStale, setOrdersStale] = useState(false);
  const [webflowError, setWebflowError] = useState<string | undefined>();

  const [detail, setDetail] = useState<{
    productId: string;
    title: string;
    lines: EventAttendanceLine[];
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadSummary = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/checkin/attendance/summary');
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to load counts');
        setEvents([]);
        return;
      }
      setEvents(data.events || []);
      setOrdersStale(Boolean(data.ordersStale));
      setWebflowError(data.webflowError);
    } catch {
      setError('Network error');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const openEvent = async (summary: EventAttendanceSummary) => {
    setDetail({ productId: summary.productId, title: summary.title, lines: [] });
    setDetailLoading(true);
    setError('');
    try {
      const res = await fetch(
        `/api/checkin/attendance/event?product_id=${encodeURIComponent(summary.productId)}`
      );
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to load event');
        setDetail(null);
        return;
      }
      setDetail({
        productId: data.productId,
        title: data.title,
        lines: data.lines || [],
      });
      setOrdersStale(Boolean(data.ordersStale));
      setWebflowError(data.webflowError);
    } catch {
      setError('Network error');
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetail(null);
    setDetailLoading(false);
  };

  if (!webflowConfigured) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 text-sm">
        Connect Webflow (<code className="bg-amber-100 px-1 rounded">WEBFLOW_API_TOKEN</code> and{' '}
        <code className="bg-amber-100 px-1 rounded">WEBFLOW_SITE_ID</code>) to see ticket counts by product.
      </div>
    );
  }

  if (detail) {
    return (
      <EventDetailPanel
        detail={detail}
        detailLoading={detailLoading}
        ordersStale={ordersStale}
        webflowError={webflowError}
        onBack={closeDetail}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-gray-600 text-sm">
          Ticket totals from cached Webflow orders, grouped by product (event). Open a card for orders and SKU breakdown.
        </p>
        <button
          type="button"
          onClick={() => void loadSummary()}
          disabled={loading}
          className="btn btn-secondary inline-flex items-center gap-2 shrink-0 self-start"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
          Refresh
        </button>
      </div>

      {ordersStale && webflowError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 text-sm">
          Showing cached orders; refresh failed: {webflowError}
        </div>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {loading && events.length === 0 ? (
        <div className="flex justify-center py-16 text-gray-500">
          <Loader2 className="animate-spin" size={32} />
        </div>
      ) : events.length === 0 ? (
        <p className="text-gray-600 text-sm py-8 text-center">No ecommerce line items found in orders yet.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {events.map((ev) => (
            <li key={ev.productId}>
              <button
                type="button"
                onClick={() => void openEvent(ev)}
                className="w-full text-left card py-5 px-6 hover:border-blue-300 hover:shadow-md transition flex flex-row gap-4 items-start group"
              >
                {ev.imageUrl ? (
                  <img
                    src={ev.imageUrl}
                    alt={ev.title}
                    className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-lg object-cover border border-gray-200 bg-white"
                  />
                ) : (
                  <div
                    className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-lg border border-dashed border-gray-200 bg-gray-50"
                    aria-hidden
                  />
                )}
                <div className="flex flex-col gap-3 min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 text-lg pr-2">{ev.title}</h3>
                    <ChevronRight
                      className="text-gray-400 group-hover:text-blue-600 shrink-0 mt-1"
                      size={20}
                      aria-hidden
                    />
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span className="inline-flex items-center gap-1">
                      <Users size={16} className="text-gray-400" />
                      {ev.orderCount} order{ev.orderCount !== 1 ? 's' : ''}
                    </span>
                    <span className="font-medium text-gray-800">{ev.totalTickets} tickets</span>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
