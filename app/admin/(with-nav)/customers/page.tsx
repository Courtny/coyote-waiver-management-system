'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import AdminPageShell from '@/components/admin/AdminPageShell';

type CustomerRow = {
  email: string;
  name: string;
  orderCount: number;
  totalTickets: number;
  totalSpend: number;
  currency?: string;
};

function formatSpend(amount: number, currency?: string): string {
  if (currency) {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
      }).format(amount);
    } catch {
      // invalid ISO code
    }
  }
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function AdminCustomersLeaderboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [ordersStale, setOrdersStale] = useState(false);
  const [webflowError, setWebflowError] = useState<string | undefined>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/customers/leaderboard');
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || 'Failed to load leaderboard');
      }
      const data = (await res.json()) as {
        customers: CustomerRow[];
        ordersStale?: boolean;
        webflowError?: string;
      };
      setCustomers(data.customers || []);
      setOrdersStale(Boolean(data.ordersStale));
      setWebflowError(data.webflowError);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch('/api/admin/check');
        if (res.status === 401 || !res.ok) {
          router.push('/admin/login');
          return;
        }
        setIsAuthenticated(true);
        await load();
      } catch {
        router.push('/admin/login');
      }
    };
    run();
  }, [router, load]);

  const emptyMessage = useMemo(() => {
    if (loading) return null;
    if (customers.length > 0) return null;
    return 'No Webflow orders in cache yet, or Webflow is not configured.';
  }, [loading, customers.length]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <AdminPageShell
      title="Top customers"
      backHref="/admin/dashboard"
      description={
        <>
          Spend uses Webflow order totals (prefer <code className="text-sm bg-gray-100 px-1 rounded">customerPaid</code>
          , then <code className="text-sm bg-gray-100 px-1 rounded">netAmount</code>
          , else sum of line <code className="text-sm bg-gray-100 px-1 rounded">rowTotal</code>). Amounts prefer the
          formatted <code className="text-sm bg-gray-100 px-1 rounded">string</code> field; bare integer{' '}
          <code className="text-sm bg-gray-100 px-1 rounded">value</code> is treated as cents for USD-like currencies.
          If totals look wrong, set env{' '}
          <code className="text-sm bg-gray-100 px-1 rounded">CHECKIN_WEBFLOW_MONEY_MINOR_UNITS=0</code>. Ticket qty is
          the sum of all line quantities.{' '}
          <Link href="/admin/tickets" className="font-medium text-blue-600 hover:text-blue-800">
            Event ticket counts →
          </Link>
        </>
      }
    >
      <div className="card space-y-4">
        {ordersStale && webflowError && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 text-sm">
            Showing cached orders; refresh failed: {webflowError}
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-600">
            {customers.length > 0 ? (
              <>
                Top {customers.length} customer{customers.length !== 1 ? 's' : ''} by spend.
              </>
            ) : null}
          </p>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="btn btn-secondary inline-flex items-center gap-2 self-start sm:self-auto"
          >
            {loading ? <Loader2 size={16} className="animate-spin shrink-0" aria-hidden /> : null}
            Refresh
          </button>
        </div>

        {error ? <p className="text-red-600 text-sm">{error}</p> : null}
        {emptyMessage ? <p className="text-gray-600 text-sm">{emptyMessage}</p> : null}

        {customers.length > 0 ? (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-[36rem] border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200 text-left">
                  <th className="px-3 py-3 font-semibold text-gray-700 w-12">#</th>
                  <th className="px-3 py-3 font-semibold text-gray-700">Name</th>
                  <th className="px-3 py-3 font-semibold text-gray-700">Email</th>
                  <th className="px-3 py-3 font-semibold text-gray-700 text-right">Orders</th>
                  <th className="px-3 py-3 font-semibold text-gray-700 text-right">Tickets</th>
                  <th className="px-3 py-3 font-semibold text-gray-700 text-right">Spend</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((row, i) => (
                  <tr key={row.email} className="border-b border-gray-100 hover:bg-gray-50/80">
                    <td className="px-3 py-2.5 text-gray-500 tabular-nums">{i + 1}</td>
                    <td className="px-3 py-2.5 text-gray-900">{row.name}</td>
                    <td className="px-3 py-2.5 text-gray-700 break-all">{row.email}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-gray-900">{row.orderCount}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-gray-900">{row.totalTickets}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-gray-900">
                      {formatSpend(row.totalSpend, row.currency)}
                      {!row.currency && row.totalSpend !== 0 ? (
                        <span className="block text-xs font-normal text-gray-500">(no currency on order)</span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </AdminPageShell>
  );
}
