'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  LogOut,
  Package,
  Search,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { PlayerNameTypeahead } from '@/components/checkin/PlayerNameTypeahead';
import { WaiverSearchResult } from '@/lib/types';

type Meta = {
  currentYear: number;
  events: { id: string; label: string }[];
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

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

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
    [name, email, phone, eventId, router]
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() && !email.trim() && !phone.trim()) {
      setError('Enter a name, email, or phone');
      return;
    }
    void runPersonSearch();
  };

  const handleWaiverPickFromTypeahead = useCallback(
    (w: WaiverSearchResult) => {
      const full = `${w.firstName} ${w.lastName}`.trim();
      setName(full);
      setEmail(w.email);
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
    setResult(null);
    setError('');
    setPartyStatus({});
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  const waiver = result?.waiver;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium mb-2"
            >
              <ArrowLeft size={16} />
              Back to dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Check-In</h1>
            <p className="text-gray-600 mt-1">
              Ask for their name, email, or phone — then confirm waiver and tickets.
            </p>
          </div>
          <button type="button" onClick={handleLogout} className="btn btn-secondary flex items-center gap-2 shrink-0">
            <LogOut size={18} />
            Logout
          </button>
        </div>

        {meta && !meta.webflowConfigured && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 text-sm">
            Webflow orders are not configured — purchase history will stay empty until{' '}
            <code className="bg-amber-100 px-1 rounded">WEBFLOW_API_TOKEN</code> and{' '}
            <code className="bg-amber-100 px-1 rounded">WEBFLOW_SITE_ID</code> are set.
          </div>
        )}

        <div className="card mb-6">
          <form onSubmit={onSubmit} className="space-y-4">
            {meta?.events && meta.events.length > 0 && (
              <div>
                <label className="label" htmlFor="event">
                  Gate / product filter (optional)
                </label>
                <select
                  id="event"
                  className="input"
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
              <label className="label" htmlFor="name">
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
            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label" htmlFor="phone">
                Phone
              </label>
              <input
                id="phone"
                type="tel"
                className="input"
                placeholder="555-123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={loading} className="btn btn-primary flex items-center gap-2">
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                Look up
              </button>
              <button type="button" onClick={clearAll} className="btn btn-secondary">
                Clear
              </button>
            </div>
          </form>
        </div>

        {result && (
          <>
            {result.ordersStale && result.webflowError && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 text-sm">
                Showing cached orders; refresh failed: {result.webflowError}
              </div>
            )}

            {waiver?.ambiguous && waiver.candidates && waiver.candidates.length > 0 && (
              <div className="card mb-6 border-2 border-amber-200">
                <div className="flex items-start gap-2 text-amber-900 font-semibold mb-3">
                  <ShieldAlert size={22} />
                  Multiple possible people — pick one to continue
                </div>
                <ul className="space-y-2">
                  {waiver.candidates.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                        onClick={() => {
                          setEmail(c.email);
                          setName(`${c.firstName} ${c.lastName}`.trim());
                          void runPersonSearch({
                            email: c.email,
                            name: `${c.firstName} ${c.lastName}`.trim(),
                          });
                        }}
                      >
                        <span className="font-medium">
                          {c.firstName} {c.lastName}
                        </span>
                        <span className="text-gray-600 text-sm block">{c.email}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!waiver?.ambiguous && (
              <div className="card mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Waiver ({result.currentYear})</h2>
                {waiver?.status === 'active' && (
                  <div className="flex items-center gap-3 text-green-700">
                    <CheckCircle2 size={28} />
                    <div>
                      <p className="font-semibold">On file for {result.currentYear}</p>
                      <p className="text-sm text-gray-600">
                        {waiver.waiver?.firstName} {waiver.waiver?.lastName} — {waiver.confidence.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                )}
                {waiver?.status === 'expired' && (
                  <div className="flex items-center gap-3 text-amber-700">
                    <ShieldAlert size={28} />
                    <div>
                      <p className="font-semibold">Expired or prior year</p>
                      <p className="text-sm text-gray-600">
                        Last waiver year: {waiver.waiver?.waiverYear} — collect a new waiver if required.
                      </p>
                    </div>
                  </div>
                )}
                {waiver?.status === 'not_found' && !waiver.ambiguous && (
                  <div className="flex items-center gap-3 text-red-700">
                    <XCircle size={28} />
                    <div>
                      <p className="font-semibold">No waiver match</p>
                      <p className="text-sm text-gray-600">Collect waiver on site or verify spelling/email.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="card mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Package size={20} />
                Purchases (newest first)
              </h2>
              {result.purchases.length === 0 ? (
                <p className="text-gray-600 text-sm">No matching Webflow orders for this identity.</p>
              ) : (
                <ul className="space-y-4">
                  {result.purchases.map((po) => (
                    <li key={po.orderId} className="border border-gray-100 rounded-lg p-4 bg-gray-50/80">
                      <p className="text-sm text-gray-500 mb-2">
                        Order <span className="font-mono">{po.orderId}</span> — {formatOrderDate(po.orderedAt)}
                      </p>
                      <ul className="space-y-2">
                        {po.lines.map((line, idx) => (
                          <li key={`${line.sku}-${idx}`} className="flex flex-wrap justify-between gap-2">
                            <span className="font-medium text-gray-900">{line.displayName}</span>
                            <span className="text-gray-600 text-sm">
                              Qty {line.quantity}
                              {line.partySize > 1 && (
                                <span className="ml-2 text-amber-800">(party {line.partySize})</span>
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
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Other party members</h2>
                <p className="text-sm text-gray-600 mb-4">
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
                          className="input"
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
                        className="btn btn-secondary shrink-0"
                        onClick={() => void checkPartyMember(i)}
                        disabled={partyStatus[i] === 'loading'}
                      >
                        {partyStatus[i] === 'loading' ? <Loader2 className="animate-spin" size={18} /> : 'Check waiver'}
                      </button>
                      <div className="sm:w-48 text-sm">
                        {partyStatus[i] === 'loading' && <span className="text-gray-500">Checking…</span>}
                        {partyStatus[i] && partyStatus[i] !== 'loading' && (
                          <span
                            className={
                              (partyStatus[i] as WaiverPayload).status === 'active'
                                ? 'text-green-700 font-medium'
                                : 'text-red-700'
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
    </div>
  );
}
