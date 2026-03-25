'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight, Loader2, RefreshCw, Users } from 'lucide-react';

type SkuBreakdownRow = {
  sku: string;
  displayName: string;
  quantity: number;
};

type EventAttendanceSummary = {
  productId: string;
  title: string;
  orderCount: number;
  totalTickets: number;
  skuBreakdown: SkuBreakdownRow[];
};

type EventAttendanceLine = {
  orderId: string;
  orderedAt: string | null;
  customerName: string;
  customerEmail: string;
  sku: string;
  displayName: string;
  quantity: number;
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

export function AttendanceTab({ webflowConfigured }: { webflowConfigured: boolean }) {
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
      <div className="space-y-4">
        <button
          type="button"
          onClick={closeDetail}
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
            {detail.lines.length} line{detail.lines.length !== 1 ? 's' : ''} ·{' '}
            {detail.lines.reduce((s, r) => s + r.quantity, 0)} tickets
          </p>
        </div>

        {detailLoading ? (
          <div className="flex justify-center py-16 text-gray-500">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-600">
                  <th className="px-4 py-3 font-semibold">SKU / ticket</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold text-right">Qty</th>
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {detail.lines.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No line items for this product in cached orders.
                    </td>
                  </tr>
                ) : (
                  detail.lines.map((row, i) => (
                    <tr key={`${row.orderId}-${row.sku}-${i}`} className="border-b border-gray-100 hover:bg-gray-50/80">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{row.displayName}</div>
                        {row.sku && (
                          <div className="text-xs text-gray-500 font-mono mt-0.5">{row.sku}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-800">{row.customerName}</td>
                      <td className="px-4 py-3 text-gray-600 break-all max-w-[200px]">{row.customerEmail}</td>
                      <td className="px-4 py-3 text-right font-medium">{row.quantity}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{row.orderId}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatOrderDate(row.orderedAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-gray-600 text-sm">
          Ticket totals from cached Webflow orders, grouped by product (event). Click a card for the full list by SKU.
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
                className="w-full text-left card py-5 px-6 hover:border-blue-300 hover:shadow-md transition flex flex-col gap-3 group"
              >
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
                <ul className="text-sm border-t border-gray-100 pt-3 space-y-1.5">
                  {ev.skuBreakdown.map((row) => (
                    <li key={row.sku} className="flex justify-between gap-2 text-gray-700">
                      <span className="truncate" title={row.displayName}>
                        {row.displayName}
                      </span>
                      <span className="font-mono text-gray-500 shrink-0">×{row.quantity}</span>
                    </li>
                  ))}
                </ul>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
