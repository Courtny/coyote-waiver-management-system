'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  Loader2,
  RefreshCw,
  Users,
} from 'lucide-react';
import type { EventAttendanceLine } from '@/lib/checkin-attendance';
import { TableSkeleton } from '@/components/admin/TableSkeleton';

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

function formatOrderDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function orderedAtTimestamp(iso: string | null): number {
  if (!iso) return 0;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? 0 : t;
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
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [sortKey, setSortKey] = useState<'quantity' | 'date'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (detailLoading) return;
    setIncludedSkus(new Set(detail.lines.map((l) => l.sku || '')));
  }, [detail.productId, detailLoading, detail.lines]);

  useEffect(() => {
    setFilterExpanded(false);
    setSortKey('date');
    setSortDir('desc');
  }, [detail.productId]);

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

  const sortedLines = useMemo(() => {
    const rows = [...filteredLines];
    rows.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'quantity') {
        cmp = a.quantity - b.quantity;
      } else {
        cmp = orderedAtTimestamp(a.orderedAt) - orderedAtTimestamp(b.orderedAt);
      }
      if (cmp !== 0) return sortDir === 'asc' ? cmp : -cmp;
      return a.orderId.localeCompare(b.orderId, undefined, { sensitivity: 'base' });
    });
    return rows;
  }, [filteredLines, sortKey, sortDir]);

  const ticketSum = filteredLines.reduce((s, r) => s + r.quantity, 0);

  const toggleColumnSort = (key: 'quantity' | 'date') => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir('desc');
      return;
    }
    setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
  };

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
        <TableSkeleton columns={8} rows={10} ariaLabel="Loading ticket lines" />
      ) : (
        <>
          {skuOptions.length > 1 ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50/80 overflow-hidden">
              <button
                type="button"
                id="event-ticket-sku-filter-toggle"
                onClick={() => setFilterExpanded((v) => !v)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-100/80 transition-colors"
                aria-expanded={filterExpanded}
                aria-controls="event-ticket-sku-filter-panel"
              >
                <span className="text-sm font-medium text-gray-800">Filter by ticket / SKU</span>
                <span className="flex items-center gap-2 shrink-0">
                  {!filterExpanded ? (
                    <span className="text-xs text-gray-500 tabular-nums">
                      {includedSkus.size}/{skuOptions.length} selected
                    </span>
                  ) : null}
                  <ChevronDown
                    size={20}
                    className={`text-gray-600 shrink-0 transition-transform ${filterExpanded ? 'rotate-180' : ''}`}
                    aria-hidden
                  />
                </span>
              </button>
              {filterExpanded ? (
                <div
                  id="event-ticket-sku-filter-panel"
                  role="region"
                  aria-labelledby="event-ticket-sku-filter-toggle"
                  className="border-t border-gray-200 px-4 pb-3"
                >
                  <div className="flex flex-wrap justify-end gap-2 mb-3 pt-3">
                    <button type="button" className="btn btn-secondary text-xs py-1.5 px-2" onClick={selectAllSkus}>
                      Select all
                    </button>
                    <button type="button" className="btn btn-secondary text-xs py-1.5 px-2" onClick={clearAllSkus}>
                      Clear
                    </button>
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
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="px-4 py-3 text-left text-gray-700 font-semibold w-14" scope="col">
                    <span className="sr-only">Image</span>
                  </th>
                  <th className="px-2 py-3 w-10 text-left text-gray-700 font-semibold" scope="col">
                    <span className="sr-only">Waiver</span>
                  </th>
                  <th className="px-4 py-3 text-left text-gray-700 font-semibold">SKU / ticket</th>
                  <th className="px-4 py-3 text-left text-gray-700 font-semibold">Customer</th>
                  <th className="px-4 py-3 text-left text-gray-700 font-semibold">Email</th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-gray-700 font-semibold"
                    aria-sort={sortKey === 'quantity' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <button
                      type="button"
                      onClick={() => toggleColumnSort('quantity')}
                      aria-label="Sort by quantity"
                      className="inline-flex w-full items-center justify-end gap-1.5 rounded px-1 py-0.5 hover:bg-gray-100 -mr-1 font-semibold text-gray-700"
                    >
                      Qty
                      {sortKey === 'quantity' ? (
                        sortDir === 'asc' ? (
                          <ArrowUp size={16} className="shrink-0 text-gray-700" aria-hidden />
                        ) : (
                          <ArrowDown size={16} className="shrink-0 text-gray-700" aria-hidden />
                        )
                      ) : (
                        <ArrowUpDown size={16} className="shrink-0 text-gray-400 opacity-70" aria-hidden />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-gray-700 font-semibold">Order</th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-gray-700 font-semibold"
                    aria-sort={sortKey === 'date' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <button
                      type="button"
                      onClick={() => toggleColumnSort('date')}
                      aria-label="Sort by date"
                      className="inline-flex items-center gap-1.5 rounded px-1 py-0.5 hover:bg-gray-100 -ml-1 font-semibold text-gray-700"
                    >
                      Date
                      {sortKey === 'date' ? (
                        sortDir === 'asc' ? (
                          <ArrowUp size={16} className="shrink-0 text-gray-700" aria-hidden />
                        ) : (
                          <ArrowDown size={16} className="shrink-0 text-gray-700" aria-hidden />
                        )
                      ) : (
                        <ArrowUpDown size={16} className="shrink-0 text-gray-400 opacity-70" aria-hidden />
                      )}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {detail.lines.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-600">
                      No line items for this product in cached orders.
                    </td>
                  </tr>
                ) : includedSkus.size === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-600">
                      No tickets / SKUs selected — choose at least one filter above or use Select all.
                    </td>
                  </tr>
                ) : (
                  sortedLines.map((row, i) => (
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
                      <td className="px-2 py-3 align-middle w-10">
                        {row.waiverIndicator ? (
                          <span
                            title={row.waiverIndicator.tooltip}
                            aria-label={row.waiverIndicator.tooltip}
                            className={
                              'inline-block h-3 w-3 rounded-full shrink-0 ' +
                              (row.waiverIndicator.level === 'green'
                                ? 'bg-green-500'
                                : row.waiverIndicator.level === 'yellow'
                                  ? 'bg-amber-400'
                                  : 'bg-red-500')
                            }
                          />
                        ) : (
                          <span
                            className="inline-block h-3 w-3 rounded-full shrink-0 bg-gray-200"
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
        <div
          className="grid gap-4 sm:grid-cols-2"
          role="status"
          aria-busy="true"
          aria-label="Loading events"
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="card py-5 px-6 flex flex-row gap-4 items-start animate-pulse"
            >
              <div className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-lg bg-gray-200" />
              <div className="flex-1 min-w-0 space-y-3">
                <div className="h-6 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
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
