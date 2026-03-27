'use client';

import { useCallback, useEffect, useState } from 'react';

export const TICKET_TABLE_STORAGE_KEY = 'coyote_event_ticket_col_widths_v1';

/** Image, Waiver, SKU, Customer, Email, Qty, Order, Date */
export const TICKET_TABLE_COLUMN_LABELS = [
  'Image',
  'Waiver',
  'SKU / ticket',
  'Customer',
  'Email',
  'Quantity',
  'Order',
  'Date',
] as const;

const DEFAULT_WIDTHS: number[] = [56, 40, 160, 180, 220, 64, 140, 160];

const MIN_WIDTHS: number[] = [48, 32, 80, 100, 120, 44, 72, 96];

const MAX_WIDTHS: number[] = [120, 72, 400, 520, 520, 120, 400, 360];

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function normalizeWidths(raw: unknown): number[] | null {
  if (!Array.isArray(raw) || raw.length !== DEFAULT_WIDTHS.length) return null;
  if (!raw.every((x) => typeof x === 'number' && Number.isFinite(x))) return null;
  return raw.map((w, i) => clamp(w, MIN_WIDTHS[i], MAX_WIDTHS[i]));
}

export function useTicketTableColumnResize() {
  const [widths, setWidths] = useState<number[]>(() => [...DEFAULT_WIDTHS]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(TICKET_TABLE_STORAGE_KEY);
      if (!stored) return;
      const parsed = normalizeWidths(JSON.parse(stored) as unknown);
      if (parsed) setWidths(parsed);
    } catch {
      /* ignore */
    }
  }, []);

  const persist = useCallback((next: number[]) => {
    try {
      localStorage.setItem(TICKET_TABLE_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const resetWidths = useCallback(() => {
    const next = [...DEFAULT_WIDTHS];
    setWidths(next);
    try {
      localStorage.removeItem(TICKET_TABLE_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const onResizePointerDown = useCallback(
    (columnIndex: number) => (e: React.PointerEvent<HTMLSpanElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.button !== 0) return;

      const startX = e.clientX;
      const startW = widths[columnIndex];

      const onMove = (ev: PointerEvent) => {
        const nextW = clamp(
          startW + (ev.clientX - startX),
          MIN_WIDTHS[columnIndex],
          MAX_WIDTHS[columnIndex]
        );
        setWidths((prev) => {
          const next = [...prev];
          next[columnIndex] = nextW;
          return next;
        });
      };

      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        setWidths((current) => {
          persist(current);
          return current;
        });
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    },
    [widths, persist]
  );

  return {
    colWidths: widths,
    onResizePointerDown,
    resetWidths,
  };
}
