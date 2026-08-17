'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  CheckCircle2,
  Loader2,
  Package,
  Search,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { Button } from '@coyote-force/ui';
import AdminPageShell from '@/components/admin/AdminPageShell';
import { EventsConfigBanner } from '@/components/checkin/EventsConfigBanner';
import { PlayerNameTypeahead } from '@/components/checkin/PlayerNameTypeahead';
import { WaiverSearchResult } from '@/lib/types';
import type { EventsConfigStatus } from '@/lib/checkin-config';

type Meta = {
  currentYear: number;
  events: { id: string; label: string }[];
  eventsConfig?: EventsConfigStatus;
  webflowConfigured: boolean;
};

type WaiverPayload = {
  status: 'active' | 'expired' | 'not_found';
  confidence: string;
  ambiguous: boolean;
  candidates?: { id: number; firstName: string; lastName: string; email: string }[];
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

type PurchaseLine = {
  sku: string;
  displayName: string;
  quantity: number;
  partySize: number;
  imageUrl?: string;
};

type PurchaseOrder = {
  orderId: string;
  orderedAt: string | null;
  lines: PurchaseLine[];
};

type PersonResponse = {
  waiver: WaiverPayload;
  purchases: PurchaseOrder[];
  ordersStale?: boolean;
  webflowError?: string;
  currentYear: number;
};

function formatOrderDate(iso: string | null): string {
  if (!iso) return 'Date unknown';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function AdminCheckInPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [meta, setMeta] = useState<Meta | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [orderId, setOrderId] = useState('');
  const [eventId, setEventId] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<PersonResponse | null>(null);

  const [partyNames, setPartyNames] = useState<string[]>([]);
  const [partyStatus, setPartyStatus] = useState<Record<number, WaiverPayload | 'loading' | null>>({});

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch('/api/admin/check');
        if (res.status === 401 || !res.ok) {
          router.push('/admin/login');
          return;
        }
        setIsAuthenticated(true);
        const m = await fetch('/api/checkin/meta');
        if (m.status === 401) {
          router.push('/admin/login');
          return;
        }
        if (m.ok) {
          setMeta(await m.json());
        }
      } catch {
        router.push('/admin/login');
      }
    };
    run();
  }, [router]);

  const totalPartyExtraSlots = useMemo(() => {
    if (!result?.purchases?.length) return 0;
    let n = 0;
    for (const po of result.purchases) {
      for (const line of po.lines) {
        if (line.partySize > 1) {
          n += line.quantity * (line.partySize - 1);
        }
      }
    }
    return Math.min(n, 8);
  }, [result]);

  useEffect(() => {
    setPartyNames((prev) => {
      const next = Array.from({ length: totalPartyExtraSlots }, (_, i) => prev[i] || '');
      return next;
    });
    setPartyStatus({});
  }, [totalPartyExtraSlots]);

  const runPersonSearch = useCallback(
    async (override?: { name?: string; email?: string; phone?: string }) => {
      setError('');
      setResult(null);
      setLoading(true);
      try {
        const res = await fetch('/api/checkin/person', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: override?.name ?? name,
            email: override?.email ?? email,
            phone: override?.phone ?? phone,
            order_id: orderId.trim() || undefined,
            event_id: eventId || undefined,
          }),
        });
        if (res.status === 401) {
          router.push('/admin/login');
          return;
        }
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Lookup failed');
          return;
        }
        setResult(data as PersonResponse);
      } catch {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    },
    [name, email, phone, orderId, eventId, router]
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() && !email.trim() && !phone.trim() && !orderId.trim()) {
      setError('Enter a name, email, phone, or order ID');
      return;
    }
    void runPersonSearch();
  };

  const handleWaiverPickFromTypeahead = useCallback(
    (w: WaiverSearchResult) => {
      const full = `${w.firstName} ${w.lastName}`.trim();
      setName(full);
      setEmail(w.email);
      setOrderId('');
      void runPersonSearch({ name: full, email: w.email, phone });
    },
    [runPersonSearch, phone]
  );

  const checkPartyMember = async (index: number) => {
    const q = partyNames[index]?.trim();
    if (!q || q.length < 2) return;
    setPartyStatus((s) => ({ ...s, [index]: 'loading' }));
    try {
      const res = await fetch('/api/checkin/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: q }),
      });
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setPartyStatus((s) => ({ ...s, [index]: null }));
        return;
      }
      setPartyStatus((s) => ({ ...s, [index]: data.waiver as WaiverPayload }));
    } catch {
      setPartyStatus((s) => ({ ...s, [index]: null }));
    }
  };

  const clearAll = () => {
    setName('');
    setEmail('');
    setPhone('');
    setOrderId('');
    setResult(null);
    setError('');
    setPartyStatus({});
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const waiver = result?.waiver;

  return (
    <AdminPageShell
      title="Check-In"
      backHref="/admin/dashboard"
      description={
        <>
          Ask for their name, email, or phone — then confirm waiver and tickets.{' '}
          <Link href="/admin/tickets" className="font-medium text-link underline underline-offset-4 hover:text-link-hover whitespace-nowrap">
            View ticket counts by event →
          </Link>
        </>
      }
    >
        <div className="mx-auto max-w-3xl">
        {meta && !meta.webflowConfigured && (
          <div className="mb-6 rounded border border-status-amber/40 bg-status-amber/15 px-4 py-3 text-foreground text-sm">
            Webflow orders are not configured — purchase history will stay empty until{' '}
            <code className="bg-status-amber/25 px-1 rounded">WEBFLOW_API_TOKEN</code> and{' '}
            <code className="bg-status-amber/25 px-1 rounded">WEBFLOW_SITE_ID</code> are set.
          </div>
        )}

        {meta && (
          <EventsConfigBanner
            webflowConfigured={meta.webflowConfigured}
            eventsCount={meta.events?.length ?? 0}
            eventsConfig={meta.eventsConfig}
          />
        )}

        <div className="rounded border border-border bg-card p-6 mb-6">
          <form onSubmit={onSubmit} className="space-y-4">
            {meta?.events && meta.events.length > 0 && (
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="event">
                  Gate / product filter (optional)
                </label>
                <select
                  id="event"
                  className="flex h-8 w-full rounded border border-input bg-transparent px-2.5 py-1 text-sm"
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                >
                  <option value="">All ticket products</option>
                  {meta.events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="name">
                Name
              </label>
              <PlayerNameTypeahead
                id="name"
                value={name}
                onChange={setName}
                onPick={handleWaiverPickFromTypeahead}
                placeholder="Start typing — fuzzy match from waivers"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="flex h-8 w-full rounded border border-input bg-transparent px-2.5 py-1 text-sm"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="phone">
                  Phone
                </label>
                <input
                  id="phone"
                  type="tel"
                  className="flex h-8 w-full rounded border border-input bg-transparent px-2.5 py-1 text-sm"
                  placeholder="555-123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="order-id">
                Order ID
              </label>
              <input
                id="order-id"
                type="text"
                className="flex h-8 w-full rounded border border-input bg-transparent px-2.5 py-1 text-sm font-mono text-sm"
                placeholder="Order number from confirmation email"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
              <div className="mt-2 space-y-2 text-xs text-muted-foreground">
                <p>
                  Optional. Loads that order from the cached Webflow list and matches the waiver using the buyer on the
                  order (name, email, or phone above override buyer fields when filled). IDs are matched
                  case-insensitively.
                </p>
                <details className="group [&_summary::-webkit-details-marker]:hidden [&_summary]:list-none">
                  <summary className="inline cursor-pointer text-sm font-medium text-link underline underline-offset-4 hover:text-link-hover">
                    Where to find the order number on the customer&apos;s email
                  </summary>
                  <figure className="mx-auto mt-3 w-full max-w-lg overflow-hidden rounded border border-border bg-card shadow-sm">
                    <Image
                      src="/images/order-id-email-sample.png"
                      alt="Sample confirmation email: Order Number appears below the line item, highlighted before the order date"
                      width={1024}
                      height={826}
                      className="h-auto w-full"
                      sizes="(max-width: 768px) 100vw, 28rem"
                    />
                    <figcaption className="border-t border-border bg-muted px-3 py-2 text-center text-muted-foreground">
                      Example confirmation email
                    </figcaption>
                  </figure>
                </details>
              </div>
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                Look up
              </Button>
              <Button type="button" variant="secondary" onClick={clearAll}>
                Clear
              </Button>
            </div>
          </form>
        </div>

        {result && (
          <>
            {result.ordersStale && result.webflowError && (
              <div className="mb-4 rounded border border-status-amber/40 bg-status-amber/15 px-4 py-3 text-foreground text-sm">
                Showing cached orders; refresh failed: {result.webflowError}
              </div>
            )}

            {waiver?.ambiguous && waiver.candidates && waiver.candidates.length > 0 && (
              <div className="rounded border border-border bg-card p-6 mb-6 border-2 border-status-amber/40">
                <div className="flex items-start gap-2 text-foreground font-semibold mb-3">
                  <ShieldAlert size={22} />
                  Multiple possible people — pick one to continue
                </div>
                <ul className="space-y-2">
                  {waiver.candidates.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        className="w-full text-left px-4 py-3 rounded border border-border hover:bg-muted transition"
                        onClick={() => {
                          setEmail(c.email);
                          setName(`${c.firstName} ${c.lastName}`.trim());
                          setOrderId('');
                          void runPersonSearch({
                            email: c.email,
                            name: `${c.firstName} ${c.lastName}`.trim(),
                          });
                        }}
                      >
                        <span className="font-medium">
                          {c.firstName} {c.lastName}
                        </span>
                        <span className="text-muted-foreground text-sm block">{c.email}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!waiver?.ambiguous && (
              <div className="rounded border border-border bg-card p-6 mb-6">
                <h2 className="text-lg font-semibold text-foreground mb-3">Waiver ({result.currentYear})</h2>
                {waiver?.status === 'active' && (
                  <div className="flex items-center gap-3 text-status-green">
                    <CheckCircle2 size={28} />
                    <div>
                      <p className="font-semibold">On file for {result.currentYear}</p>
                      <p className="text-sm text-muted-foreground">
                        {waiver.waiver?.firstName} {waiver.waiver?.lastName} — {waiver.confidence.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                )}
                {waiver?.status === 'expired' && (
                  <div className="flex items-center gap-3 text-status-amber">
                    <ShieldAlert size={28} />
                    <div>
                      <p className="font-semibold">Expired or prior year</p>
                      <p className="text-sm text-muted-foreground">
                        Last waiver year: {waiver.waiver?.waiverYear} — collect a new waiver if required.
                      </p>
                    </div>
                  </div>
                )}
                {waiver?.status === 'not_found' && !waiver.ambiguous && (
                  <div className="flex items-center gap-3 text-destructive">
                    <XCircle size={28} />
                    <div>
                      <p className="font-semibold">No waiver match</p>
                      <p className="text-sm text-muted-foreground">Collect waiver on site or verify spelling/email.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="rounded border border-border bg-card p-6 mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <Package size={20} />
                Purchases (newest first)
              </h2>
              {result.purchases.length === 0 ? (
                <p className="text-muted-foreground text-sm">No matching Webflow orders for this identity.</p>
              ) : (
                <ul className="space-y-4">
                  {result.purchases.map((po) => (
                    <li key={po.orderId} className="border border-border rounded p-4 bg-muted/80">
                      <p className="text-sm text-muted-foreground mb-2">
                        Order <span className="font-mono">{po.orderId}</span> — {formatOrderDate(po.orderedAt)}
                      </p>
                      <ul className="space-y-2">
                        {po.lines.map((line, idx) => (
                          <li
                            key={`${line.sku}-${idx}`}
                            className="flex flex-wrap items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {line.imageUrl ? (
                                <img
                                  src={line.imageUrl}
                                  alt={line.displayName}
                                  className="h-12 w-12 shrink-0 rounded-md object-cover border border-border bg-card"
                                />
                              ) : (
                                <div
                                  className="h-12 w-12 shrink-0 rounded-md border border-dashed border-border bg-muted"
                                  aria-hidden
                                />
                              )}
                              <span className="font-medium text-foreground">{line.displayName}</span>
                            </div>
                            <span className="text-muted-foreground text-sm shrink-0">
                              Qty {line.quantity}
                              {line.partySize > 1 && (
                                <span className="ml-2 text-foreground">(party {line.partySize})</span>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {totalPartyExtraSlots > 0 && !waiver?.ambiguous && (
              <div className="rounded border border-border bg-card p-6">
                <h2 className="text-lg font-semibold text-foreground mb-2">Other party members</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  This purchase may include additional entrants. Check each name against waivers.
                </p>
                <div className="space-y-4">
                  {partyNames.map((pn, i) => (
                    <div key={i} className="flex flex-col sm:flex-row gap-2 sm:items-end">
                      <div className="flex-1">
                        <label className="label text-sm" htmlFor={`party-${i}`}>
                          Member {i + 1}
                        </label>
                        <input
                          id={`party-${i}`}
                          className="flex h-8 w-full rounded border border-input bg-transparent px-2.5 py-1 text-sm"
                          value={pn}
                          onChange={(e) => {
                            const v = e.target.value;
                            setPartyNames((arr) => {
                              const next = [...arr];
                              next[i] = v;
                              return next;
                            });
                          }}
                          placeholder="Full name"
                        />
                      </div>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded border border-border bg-background px-2.5 py-1.5 text-sm font-medium hover:bg-muted shrink-0"
                        onClick={() => void checkPartyMember(i)}
                        disabled={partyStatus[i] === 'loading'}
                      >
                        {partyStatus[i] === 'loading' ? <Loader2 className="animate-spin" size={18} /> : 'Check waiver'}
                      </button>
                      <div className="sm:w-48 text-sm">
                        {partyStatus[i] === 'loading' && <span className="text-muted-foreground">Checking…</span>}
                        {partyStatus[i] && partyStatus[i] !== 'loading' && (
                          <span
                            className={
                              (partyStatus[i] as WaiverPayload).status === 'active'
                                ? 'text-status-green font-medium'
                                : 'text-destructive'
                            }
                          >
                            {(partyStatus[i] as WaiverPayload).status === 'active'
                              ? 'Waiver OK'
                              : (partyStatus[i] as WaiverPayload).status === 'expired'
                                ? 'Expired / old year'
                                : 'Not found'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        </div>
    </AdminPageShell>
  );
}
