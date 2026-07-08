'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowUpDown,
  Check,
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

function rowMatchesLineSearch(row: EventAttendanceLine, queryLower: string): boolean {
  if (!queryLower) return true;
  const orderId = (row.orderId || '').toLowerCase();
  const email = (row.customerEmail || '').toLowerCase();
  const name = (row.customerName || '').toLowerCase();
  return (
    orderId.includes(queryLower) || email.includes(queryLower) || name.includes(queryLower)
  );
}

function rowAllCheckedIn(row: EventAttendanceLine): boolean {
  const checked = row.checkedInUnits?.length ?? 0;
  return checked >= row.quantity && row.quantity > 0;
}

type EventDetailPanelProps = {
  detail: { productId: string; title: string; lines: EventAttendanceLine[] };
  detailLoading: boolean;
  ordersStale: boolean;
  webflowError?: string;
  onBack: () => void;
  onLinesChange: (lines: EventAttendanceLine[]) => void;
};

function TicketCheckInButtons({
  row,
  productId,
  onUnitsChange,
}: {
  row: EventAttendanceLine;
  productId: string;
  onUnitsChange: (checkedInUnits: number[]) => void;
}) {
  const [pending, setPending] = useState<number | null>(null);
  const checkedSet = useMemo(() => new Set(row.checkedInUnits ?? []), [row.checkedInUnits]);

  const handleCheckIn = async (unitIndex: number) => {
    if (checkedSet.has(unitIndex) || pending !== null) return;

    const prev = row.checkedInUnits ?? [];
    const optimistic = [...prev, unitIndex].sort((a, b) => a - b);
    onUnitsChange(optimistic);
    setPending(unitIndex);

    try {
      const res = await fetch('/api/checkin/attendance/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          order_id: row.orderId,
          variant_id: row.variantId,
          unit_index: unitIndex,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        onUnitsChange(prev);
        return;
      }
      onUnitsChange(data.checkedInUnits ?? optimistic);
    } catch {
      onUnitsChange(prev);
    } finally {
      setPending(null);
    }
  };

  const handleUndo = async (unitIndex: number) => {
    if (!checkedSet.has(unitIndex) || pending !== null) return;

    const prev = row.checkedInUnits ?? [];
    const optimistic = prev.filter((u) => u !== unitIndex);
    onUnitsChange(optimistic);
    setPending(unitIndex);

    try {
      const res = await fetch('/api/checkin/attendance/checkin', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          order_id: row.orderId,
          variant_id: row.variantId,
          unit_index: unitIndex,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        onUnitsChange(prev);
        return;
      }
      onUnitsChange(data.checkedInUnits ?? optimistic);
    } catch {
      onUnitsChange(prev);
    } finally {
      setPending(null);
    }
  };

  const handleUnitClick = (unitIndex: number) => {
    if (checkedSet.has(unitIndex)) {
      void handleUndo(unitIndex);
    } else {
      void handleCheckIn(unitIndex);
    }
  };

  return (
    <div className="flex flex-wrap gap-1 justify-end">
      {Array.from({ length: row.quantity }, (_, i) => {
        const checked = checkedSet.has(i);
        const isPending = pending === i;
        return (
          <button
            key={i}
            type="button"
            disabled={pending !== null}
            onClick={() => handleUnitClick(i)}
            title={checked ? 'Undo check-in' : undefined}
            aria-label={
              checked ? `Undo check-in for ticket ${i + 1}` : `Check in ticket ${i + 1}`
            }
            className={
              'inline-flex h-8 min-w-[2rem] items-center justify-center rounded-md border text-xs font-medium transition-colors ' +
              (checked
                ? 'border-green-600 bg-green-600 text-white cursor-pointer hover:bg-green-700'
                : isPending
                  ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-wait'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-green-500 hover:bg-green-50 hover:text-green-800')
            }
          >
            {checked ? <Check size={14} aria-hidden /> : i + 1}
          </button>
        );
      })}
    </div>
  );
}

function EventDetailPanel({
  detail,
  detailLoading,
  ordersStale,
  webflowError,
  onBack,
  onLinesChange,
}: EventDetailPanelProps) {
  const [includedSkus, setIncludedSkus] = useState<Set<string>>(() => new Set());
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<'quantity' | 'date'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [uncheckedOnly, setUncheckedOnly] = useState(false);

  useEffect(() => {
    if (detailLoading) return;
    setIncludedSkus(new Set(detail.lines.map((l) => l.sku || '')));
  }, [detail.productId, detailLoading, detail.lines]);

  useEffect(() => {
    setFilterExpanded(false);
    setSearchQuery('');
    setSortKey('date');
    setSortDir('desc');
    setUncheckedOnly(false);
  }, [detail.productId]);

  const updateLineCheckins = (orderId: string, variantId: string, checkedInUnits: number[]) => {
    onLinesChange(
      detail.lines.map((line) =>
        line.orderId === orderId && line.variantId === variantId
          ? { ...line, checkedInUnits }
          : line
      )
    );
  };

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

  const textFilteredLines = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let rows = filteredLines;
    if (uncheckedOnly) {
      rows = rows.filter((row) => !rowAllCheckedIn(row));
    }
    if (!q) return rows;
    return rows.filter((row) => rowMatchesLineSearch(row, q));
  }, [filteredLines, searchQuery, uncheckedOnly]);

  const checkedInTotal = useMemo(
    () => detail.lines.reduce((s, r) => s + (r.checkedInUnits?.length ?? 0), 0),
    [detail.lines]
  );
  const ticketTotal = useMemo(
    () => detail.lines.reduce((s, r) => s + r.quantity, 0),
    [detail.lines]
  );

  const sortedLines = useMemo(() => {
    const rows = [...textFilteredLines];
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
  }, [textFilteredLines, sortKey, sortDir]);

  const ticketSum = textFilteredLines.reduce((s, r) => s + r.quantity, 0);

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
          <span className="font-medium text-gray-800">
            {checkedInTotal} / {ticketTotal} checked in
          </span>
          {' · '}
          {textFilteredLines.length} line{textFilteredLines.length !== 1 ? 's' : ''} · {ticketSum} tickets
          {filteredLines.length !== detail.lines.length ? (
            <span className="text-gray-500"> (of {detail.lines.length} lines)</span>
          ) : null}
          {searchQuery.trim() && textFilteredLines.length < filteredLines.length ? (
            <span className="text-gray-500"> (of {filteredLines.length} matching SKU filters)</span>
          ) : null}
        </p>
      </div>

      {detailLoading ? (
        <TableSkeleton columns={9} rows={10} ariaLabel="Loading ticket lines" />
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

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="w-full sm:max-w-md">
              <label htmlFor="event-ticket-line-search" className="label text-sm">
                Search orders
              </label>
              <input
                id="event-ticket-line-search"
                type="search"
                inputMode="search"
                autoComplete="off"
                placeholder="Order ID, email, or customer name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input w-full"
                aria-label="Search by order ID, email, or customer name"
              />
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer shrink-0 pb-1">
              <input
                type="checkbox"
                className="rounded border-gray-300"
                checked={uncheckedOnly}
                onChange={(e) => setUncheckedOnly(e.target.checked)}
              />
              Show unchecked only
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-fixed border-collapse">
              <colgroup>
                <col className="w-[5.5rem]" />
                <col className="w-10" />
                <col className="w-[10rem]" />
                <col className="w-[18%]" />
                <col className="w-[22%]" />
                <col className="w-14" />
                <col className="w-[12%]" />
                <col className="w-48" />
                <col className="w-28" />
              </colgroup>
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="px-3 py-3 text-left text-gray-700 font-semibold" scope="col">
                    <span className="sr-only">Image</span>
                  </th>
                  <th className="px-2 py-3 text-left text-gray-700 font-semibold" scope="col">
                    <span className="sr-only">Waiver</span>
                  </th>
                  <th className="px-3 py-3 text-left text-gray-700 font-semibold">SKU / ticket</th>
                  <th className="px-3 py-3 text-left text-gray-700 font-semibold">Customer</th>
                  <th className="px-3 py-3 text-left text-gray-700 font-semibold">Email</th>
                  <th
                    scope="col"
                    className="px-3 py-3 text-right text-gray-700 font-semibold"
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
                  <th className="px-3 py-3 text-left text-gray-700 font-semibold">Order</th>
                  <th
                    scope="col"
                    className="px-3 py-3 text-left text-gray-700 font-semibold"
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
                  <th className="px-3 py-3 text-right text-gray-700 font-semibold" scope="col">
                    Check in
                  </th>
                </tr>
              </thead>
              <tbody>
                {detail.lines.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-600">
                      No line items for this product in cached orders.
                    </td>
                  </tr>
                ) : includedSkus.size === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-600">
                      No tickets / SKUs selected — choose at least one filter above or use Select all.
                    </td>
                  </tr>
                ) : filteredLines.length > 0 &&
                  textFilteredLines.length === 0 &&
                  searchQuery.trim() ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-600">
                      No rows match your search. Try different order ID, email, or name keywords.
                    </td>
                  </tr>
                ) : filteredLines.length > 0 &&
                  textFilteredLines.length === 0 &&
                  uncheckedOnly ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-600">
                      All visible tickets are checked in.
                    </td>
                  </tr>
                ) : (
                  sortedLines.map((row, i) => {
                    const allChecked = rowAllCheckedIn(row);
                    return (
                    <tr
                      key={`${row.orderId}-${row.variantId}-${row.sku}-${i}`}
                      className={
                        'border-b border-gray-200 transition-colors ' +
                        (allChecked ? 'opacity-50 bg-gray-100' : 'hover:bg-gray-50')
                      }
                    >
                      <td className="px-3 py-3 align-middle">
                        {row.imageUrl ? (
                          <img
                            src={row.imageUrl}
                            alt={row.displayName}
                            className="h-14 w-14 rounded-md object-cover border border-gray-200 bg-white"
                          />
                        ) : (
                          <div
                            className="h-14 w-14 rounded-md border border-dashed border-gray-200 bg-gray-50"
                            aria-hidden
                          />
                        )}
                      </td>
                      <td className="px-2 py-3 align-middle">
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
                      <td className="px-3 py-3 font-medium align-top min-w-0">
                        <div className="text-gray-900 text-sm leading-snug break-words">{row.displayName}</div>
                        {row.sku && (
                          <div className="text-xs text-gray-500 font-mono mt-0.5 break-all">{row.sku}</div>
                        )}
                        {row.receivesEventPatch && (
                          <span className="inline-flex items-center rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 text-xs font-medium text-amber-800 mt-1">
                            Receives Event Patch
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-gray-600 align-top min-w-0 break-words">
                        {row.customerName}
                      </td>
                      <td className="px-3 py-3 text-gray-600 align-top min-w-0 break-all">
                        {row.customerEmail}
                      </td>
                      <td className="px-3 py-3 text-right text-gray-600 font-medium align-top">
                        {row.quantity}
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-gray-600 align-top break-all min-w-0">
                        {row.orderId}
                      </td>
                      <td className="px-3 py-3 text-gray-600 whitespace-nowrap align-top">
                        {formatOrderDate(row.orderedAt)}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <TicketCheckInButtons
                          row={row}
                          productId={detail.productId}
                          onUnitsChange={(units) =>
                            updateLineCheckins(row.orderId, row.variantId, units)
                          }
                        />
                      </td>
                    </tr>
                    );
                  })
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
        onLinesChange={(lines) => setDetail((d) => (d ? { ...d, lines } : d))}
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
