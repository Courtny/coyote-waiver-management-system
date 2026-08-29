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
  X,
} from 'lucide-react';
import { lineHasRental, rentalCountForLine, type EventAttendanceLine } from '@/lib/checkin-attendance';
import { TableSkeleton } from '@/components/admin/TableSkeleton';
import { Label, Switch } from '@coyote-force/ui';

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
  showAsActive?: boolean;
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

function rowLineKey(row: EventAttendanceLine): string {
  return `${row.orderId}|${row.variantId}|${row.sku}`;
}

type EventDetailPanelProps = {
  detail: { productId: string; title: string; lines: EventAttendanceLine[] };
  detailLoading: boolean;
  ordersStale: boolean;
  webflowError?: string;
  showAsActive: boolean;
  onShowAsActiveChange: (next: boolean) => Promise<void>;
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
                ? 'border-status-green bg-status-green text-white cursor-pointer hover:bg-status-green/90'
                : isPending
                  ? 'border-input bg-muted text-muted-foreground cursor-wait'
                  : 'border-input bg-card text-foreground hover:border-status-green hover:bg-status-green/10 hover:text-status-green')
            }
          >
            {checked ? <Check size={14} aria-hidden /> : i + 1}
          </button>
        );
      })}
    </div>
  );
}

function LineDetailTray({
  row,
  onClose,
}: {
  row: EventAttendanceLine;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const rentals = rentalCountForLine(row);

  return (
    <div className="fixed inset-0 z-[60]" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close ticket details"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="ticket-line-detail-title"
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-card border-l border-border shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h3 id="ticket-line-detail-title" className="text-lg font-semibold text-foreground">
              Ticket details
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5 truncate">{row.customerName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border hover:bg-muted"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {row.imageUrl ? (
            <img
              src={row.imageUrl}
              alt={row.displayName}
              className="h-28 w-28 rounded-md object-cover border border-border bg-card"
            />
          ) : null}
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">SKU / ticket</p>
            <p className="text-sm text-foreground mt-1 leading-snug">{row.displayName}</p>
            {row.sku ? (
              <p className="text-xs text-muted-foreground font-mono mt-1 break-all">{row.sku}</p>
            ) : null}
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Customer</dt>
              <dd className="mt-0.5 text-foreground break-words">{row.customerName}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</dt>
              <dd className="mt-0.5 text-foreground break-all">{row.customerEmail}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Quantity</dt>
              <dd className="mt-0.5 text-foreground">{row.quantity}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Party size</dt>
              <dd className="mt-0.5 text-foreground">{row.partySize || 1}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Rentals</dt>
              <dd className="mt-0.5 text-foreground">{rentals}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Order</dt>
              <dd className="mt-0.5 text-foreground font-mono text-xs break-all">{row.orderId}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Date</dt>
              <dd className="mt-0.5 text-foreground">{formatOrderDate(row.orderedAt)}</dd>
            </div>
          </dl>
          {row.receivesEventPatch ? (
            <span className="inline-flex items-center rounded-full bg-status-amber/25 border border-amber-300 px-2 py-0.5 text-xs font-medium text-foreground">
              Receives Event Patch
            </span>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function EventDetailPanel({
  detail,
  detailLoading,
  ordersStale,
  webflowError,
  showAsActive,
  onShowAsActiveChange,
  onBack,
  onLinesChange,
}: EventDetailPanelProps) {
  const [showRentals, setShowRentals] = useState(true);
  const [showNonRentals, setShowNonRentals] = useState(true);
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<'quantity' | 'date'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [uncheckedOnly, setUncheckedOnly] = useState(false);
  const [savingActive, setSavingActive] = useState(false);
  const [selectedLineKey, setSelectedLineKey] = useState<string | null>(null);

  useEffect(() => {
    setFilterExpanded(false);
    setSearchQuery('');
    setSortKey('date');
    setSortDir('desc');
    setUncheckedOnly(false);
    setShowRentals(true);
    setShowNonRentals(true);
    setSelectedLineKey(null);
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

  const hasRentalLines = useMemo(
    () => detail.lines.some((row) => lineHasRental(row.displayName, row.sku)),
    [detail.lines]
  );
  const hasNonRentalLines = useMemo(
    () => detail.lines.some((row) => !lineHasRental(row.displayName, row.sku)),
    [detail.lines]
  );
  const showRentalFilter = hasRentalLines && hasNonRentalLines;

  const filteredLines = useMemo(
    () =>
      detail.lines.filter((row) =>
        lineHasRental(row.displayName, row.sku) ? showRentals : showNonRentals
      ),
    [detail.lines, showRentals, showNonRentals]
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
  const rentalFilterActive = showRentalFilter && (!showRentals || !showNonRentals);

  const toggleColumnSort = (key: 'quantity' | 'date') => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir('desc');
      return;
    }
    setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
  };

  const selectedLine = useMemo(() => {
    if (!selectedLineKey) return null;
    return detail.lines.find((row) => rowLineKey(row) === selectedLineKey) ?? null;
  }, [selectedLineKey, detail.lines]);

  const openLine = (row: EventAttendanceLine) => {
    setSelectedLineKey(rowLineKey(row));
  };

  const closeTray = useCallback(() => {
    setSelectedLineKey(null);
  }, []);

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-medium text-link underline underline-offset-4 hover:text-link-hover"
      >
        <ArrowLeft size={16} />
        Back to event list
      </button>

      {ordersStale && webflowError && (
        <div className="rounded border border-status-amber/40 bg-status-amber/15 px-4 py-3 text-foreground text-sm">
          Showing cached orders; refresh failed: {webflowError}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-foreground">{detail.title}</h2>
        <div className="flex flex-col gap-2 sm:items-end">
          <div className="flex items-center gap-2">
            <Switch
              id="show-as-active"
              size="sm"
              checked={showAsActive}
              disabled={savingActive}
              onCheckedChange={(checked) => {
                void (async () => {
                  setSavingActive(true);
                  try {
                    await onShowAsActiveChange(checked);
                  } finally {
                    setSavingActive(false);
                  }
                })();
              }}
            />
            <Label htmlFor="show-as-active" className="text-sm font-medium">
              Show as active
            </Label>
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {checkedInTotal} / {ticketTotal} checked in
            </span>
            {' · '}
            {textFilteredLines.length} line{textFilteredLines.length !== 1 ? 's' : ''} · {ticketSum} tickets
            {rentalFilterActive ? (
              <span className="text-muted-foreground"> (of {detail.lines.length} lines)</span>
            ) : null}
            {searchQuery.trim() && textFilteredLines.length < filteredLines.length ? (
              <span className="text-muted-foreground"> (of {filteredLines.length} matching filters)</span>
            ) : null}
          </p>
        </div>
      </div>

      {detailLoading ? (
        <TableSkeleton columns={9} rows={10} ariaLabel="Loading ticket lines" />
      ) : (
        <>
          {showRentalFilter ? (
            <div className="rounded border border-border bg-muted/80 overflow-hidden">
              <button
                type="button"
                id="event-ticket-rental-filter-toggle"
                onClick={() => setFilterExpanded((v) => !v)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/80 transition-colors"
                aria-expanded={filterExpanded}
                aria-controls="event-ticket-rental-filter-panel"
              >
                <span className="text-sm font-medium text-foreground">Filter by rental</span>
                <span className="flex items-center gap-2 shrink-0">
                  {!filterExpanded ? (
                    <span className="text-xs text-muted-foreground">
                      {showRentals && showNonRentals
                        ? 'All'
                        : showRentals
                          ? 'Rental only'
                          : showNonRentals
                            ? 'No rental only'
                            : 'None'}
                    </span>
                  ) : null}
                  <ChevronDown
                    size={20}
                    className={`text-muted-foreground shrink-0 transition-transform ${filterExpanded ? 'rotate-180' : ''}`}
                    aria-hidden
                  />
                </span>
              </button>
              {filterExpanded ? (
                <div
                  id="event-ticket-rental-filter-panel"
                  role="region"
                  aria-labelledby="event-ticket-rental-filter-toggle"
                  className="border-t border-border px-4 py-3"
                >
                  <ul className="flex flex-wrap gap-x-6 gap-y-2">
                    <li>
                      <label className="inline-flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          className="rounded border-input"
                          checked={showRentals}
                          onChange={(e) => setShowRentals(e.target.checked)}
                        />
                        <span className="font-medium text-foreground">Rental</span>
                      </label>
                    </li>
                    <li>
                      <label className="inline-flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          className="rounded border-input"
                          checked={showNonRentals}
                          onChange={(e) => setShowNonRentals(e.target.checked)}
                        />
                        <span className="font-medium text-foreground">No rental</span>
                      </label>
                    </li>
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
                className="flex h-8 w-full rounded border border-input bg-transparent px-2.5 py-1 text-sm w-full"
                aria-label="Search by order ID, email, or customer name"
              />
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-foreground cursor-pointer shrink-0 pb-1">
              <input
                type="checkbox"
                className="rounded border-input"
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
                <col className="w-[22%]" />
                <col className="w-16" />
                <col className="w-[22%]" />
                <col className="w-14" />
                <col className="w-[12%]" />
                <col className="w-48" />
                <col className="w-28" />
              </colgroup>
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="px-3 py-3 text-left text-foreground font-semibold" scope="col">
                    <span className="sr-only">Image</span>
                  </th>
                  <th className="px-2 py-3 text-left text-foreground font-semibold" scope="col">
                    <span className="sr-only">Waiver</span>
                  </th>
                  <th className="px-3 py-3 text-left text-foreground font-semibold">Customer</th>
                  <th className="px-3 py-3 text-right text-foreground font-semibold">Rental</th>
                  <th className="px-3 py-3 text-left text-foreground font-semibold">Email</th>
                  <th
                    scope="col"
                    className="px-3 py-3 text-right text-foreground font-semibold"
                    aria-sort={sortKey === 'quantity' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <button
                      type="button"
                      onClick={() => toggleColumnSort('quantity')}
                      aria-label="Sort by quantity"
                      className="inline-flex w-full items-center justify-end gap-1.5 rounded px-1 py-0.5 hover:bg-muted -mr-1 font-semibold text-foreground"
                    >
                      Qty
                      {sortKey === 'quantity' ? (
                        sortDir === 'asc' ? (
                          <ArrowUp size={16} className="shrink-0 text-foreground" aria-hidden />
                        ) : (
                          <ArrowDown size={16} className="shrink-0 text-foreground" aria-hidden />
                        )
                      ) : (
                        <ArrowUpDown size={16} className="shrink-0 text-muted-foreground opacity-70" aria-hidden />
                      )}
                    </button>
                  </th>
                  <th className="px-3 py-3 text-left text-foreground font-semibold">Order</th>
                  <th
                    scope="col"
                    className="px-3 py-3 text-left text-foreground font-semibold"
                    aria-sort={sortKey === 'date' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <button
                      type="button"
                      onClick={() => toggleColumnSort('date')}
                      aria-label="Sort by date"
                      className="inline-flex items-center gap-1.5 rounded px-1 py-0.5 hover:bg-muted -ml-1 font-semibold text-foreground"
                    >
                      Date
                      {sortKey === 'date' ? (
                        sortDir === 'asc' ? (
                          <ArrowUp size={16} className="shrink-0 text-foreground" aria-hidden />
                        ) : (
                          <ArrowDown size={16} className="shrink-0 text-foreground" aria-hidden />
                        )
                      ) : (
                        <ArrowUpDown size={16} className="shrink-0 text-muted-foreground opacity-70" aria-hidden />
                      )}
                    </button>
                  </th>
                  <th className="px-3 py-3 text-right text-foreground font-semibold" scope="col">
                    Check in
                  </th>
                </tr>
              </thead>
              <tbody>
                {detail.lines.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                      No line items for this product in cached orders.
                    </td>
                  </tr>
                ) : showRentalFilter && !showRentals && !showNonRentals ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                      No rental filters selected — choose Rental, No rental, or both.
                    </td>
                  </tr>
                ) : filteredLines.length > 0 &&
                  textFilteredLines.length === 0 &&
                  searchQuery.trim() ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                      No rows match your search. Try different order ID, email, or name keywords.
                    </td>
                  </tr>
                ) : filteredLines.length > 0 &&
                  textFilteredLines.length === 0 &&
                  uncheckedOnly ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                      All visible tickets are checked in.
                    </td>
                  </tr>
                ) : (
                  sortedLines.map((row, i) => {
                    const allChecked = rowAllCheckedIn(row);
                    const isSelected = selectedLineKey === rowLineKey(row);
                    const rentals = rentalCountForLine(row);
                    return (
                    <tr
                      key={rowLineKey(row) + String(i)}
                      tabIndex={0}
                      aria-selected={isSelected}
                      onClick={() => openLine(row)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openLine(row);
                        }
                      }}
                      className={
                        'border-b border-border transition-colors cursor-pointer ' +
                        (isSelected
                          ? 'bg-muted ring-1 ring-inset ring-border'
                          : allChecked
                            ? 'opacity-50 bg-muted hover:bg-muted'
                            : 'hover:bg-muted')
                      }
                    >
                      <td className="px-3 py-3 align-middle">
                        {row.imageUrl ? (
                          <img
                            src={row.imageUrl}
                            alt=""
                            className="h-14 w-14 rounded-md object-cover border border-border bg-card"
                          />
                        ) : (
                          <div
                            className="h-14 w-14 rounded-md border border-dashed border-border bg-muted"
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
                                ? 'bg-status-green/100'
                                : row.waiverIndicator.level === 'yellow'
                                  ? 'bg-amber-400'
                                  : 'bg-destructive/100')
                            }
                          />
                        ) : (
                          <span
                            className="inline-block h-3 w-3 rounded-full shrink-0 bg-muted"
                            aria-hidden
                          />
                        )}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground align-middle min-w-0 break-words">
                        <div>{row.customerName}</div>
                        {row.receivesEventPatch ? (
                          <span className="inline-flex items-center rounded-full bg-status-amber/25 border border-amber-300 px-2 py-0.5 text-xs font-medium text-foreground mt-1">
                            Receives Event Patch
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 text-right font-medium align-middle tabular-nums">
                        <span className={rentals > 0 ? 'text-foreground' : 'text-muted-foreground'}>
                          {rentals}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground align-middle min-w-0 break-all">
                        {row.customerEmail}
                      </td>
                      <td className="px-3 py-3 text-right text-muted-foreground font-medium align-middle">
                        {row.quantity}
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-muted-foreground align-middle break-all min-w-0">
                        {row.orderId}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground whitespace-nowrap align-middle">
                        {formatOrderDate(row.orderedAt)}
                      </td>
                      <td
                        className="px-3 py-3 align-middle"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
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
          {selectedLine ? <LineDetailTray row={selectedLine} onClose={closeTray} /> : null}
        </>
      )}
    </div>
  );
}



function EventCard({
  event,
  onOpen,
}: {
  event: EventAttendanceSummary;
  onOpen: (summary: EventAttendanceSummary) => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(event)}
        className="w-full text-left card py-5 px-6 hover:border-blue-300 hover:shadow-md transition flex flex-row gap-4 items-start group"
      >
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded object-cover border border-border bg-card"
          />
        ) : (
          <div
            className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded border border-dashed border-border bg-muted"
            aria-hidden
          />
        )}
        <div className="flex flex-col gap-3 min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground text-lg pr-2">{event.title}</h3>
            <ChevronRight
              className="text-muted-foreground group-hover:text-link shrink-0 mt-1"
              size={20}
              aria-hidden
            />
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Users size={16} className="text-muted-foreground" />
              {event.orderCount} order{event.orderCount !== 1 ? 's' : ''}
            </span>
            <span className="font-medium text-foreground">{event.totalTickets} tickets</span>
          </div>
        </div>
      </button>
    </li>
  );
}

function EventCardGrid({
  events,
  onOpen,
}: {
  events: EventAttendanceSummary[];
  onOpen: (summary: EventAttendanceSummary) => void;
}) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {events.map((ev) => (
        <EventCard key={ev.productId} event={ev} onOpen={onOpen} />
      ))}
    </ul>
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
  const [detailShowAsActive, setDetailShowAsActive] = useState(false);

  const activeEvents = useMemo(() => events.filter((e) => e.showAsActive), [events]);
  const pastEvents = useMemo(() => events.filter((e) => !e.showAsActive), [events]);

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
      setEvents(
        Array.isArray(data.active) || Array.isArray(data.past)
          ? [...(data.active || []), ...(data.past || [])]
          : data.events || []
      );
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
    setDetailShowAsActive(Boolean(summary.showAsActive));
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
      if (typeof data.showAsActive === 'boolean') {
        setDetailShowAsActive(data.showAsActive);
      }
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

  const handleShowAsActiveChange = async (next: boolean) => {
    if (!detail) return;
    const productId = detail.productId;
    const previous = detailShowAsActive;
    setDetailShowAsActive(next);
    setEvents((prev) =>
      prev.map((ev) => (ev.productId === productId ? { ...ev, showAsActive: next } : ev))
    );
    try {
      const res = await fetch('/api/checkin/attendance/active', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, show_as_active: next }),
      });
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (!res.ok) {
        throw new Error('Failed to save');
      }
    } catch {
      setDetailShowAsActive(previous);
      setEvents((prev) =>
        prev.map((ev) => (ev.productId === productId ? { ...ev, showAsActive: previous } : ev))
      );
    }
  };

  if (!webflowConfigured) {
    return (
      <div className="rounded border border-status-amber/40 bg-status-amber/15 px-4 py-3 text-foreground text-sm">
        Connect Webflow (<code className="bg-status-amber/25 px-1 rounded">WEBFLOW_API_TOKEN</code> and{' '}
        <code className="bg-status-amber/25 px-1 rounded">WEBFLOW_SITE_ID</code>) to see ticket counts by product.
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
        showAsActive={detailShowAsActive}
        onShowAsActiveChange={handleShowAsActiveChange}
        onBack={closeDetail}
        onLinesChange={(lines) => setDetail((d) => (d ? { ...d, lines } : d))}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          Ticket totals from cached Webflow orders, grouped by product (event). Open a card for orders and rental counts.
        </p>
        <button
          type="button"
          onClick={() => void loadSummary()}
          disabled={loading}
          className="inline-flex items-center justify-center rounded border border-border bg-background px-2.5 py-1.5 text-sm font-medium hover:bg-muted inline-flex items-center gap-2 shrink-0 self-start"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
          Refresh
        </button>
      </div>

      {ordersStale && webflowError && (
        <div className="rounded border border-status-amber/40 bg-status-amber/15 px-4 py-3 text-foreground text-sm">
          Showing cached orders; refresh failed: {webflowError}
        </div>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}

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
              className="rounded border border-border bg-card p-6 py-5 px-6 flex flex-row gap-4 items-start animate-pulse"
            >
              <div className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded bg-muted" />
              <div className="flex-1 min-w-0 space-y-3">
                <div className="h-6 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">No ecommerce line items found in orders yet.</p>
      ) : (
        <div className="space-y-8">
          {activeEvents.length > 0 ? (
            <EventCardGrid events={activeEvents} onOpen={(ev) => void openEvent(ev)} />
          ) : (
            <p className="text-muted-foreground text-sm">
              No active events. Open an event and turn on Show as active to pin it here.
            </p>
          )}
          {pastEvents.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Past events
              </h2>
              <EventCardGrid events={pastEvents} onOpen={(ev) => void openEvent(ev)} />
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
