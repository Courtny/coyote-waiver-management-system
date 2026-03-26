'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, LogOut } from 'lucide-react';
import { EventTicketCounts } from '@/components/checkin/EventTicketCounts';

type Meta = {
  currentYear: number;
  events: { id: string; label: string }[];
  webflowConfigured: boolean;
};

export default function AdminTicketsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [meta, setMeta] = useState<Meta | null>(null);

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

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium mb-2"
            >
              <ArrowLeft size={16} />
              Back to dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Event ticket counts</h1>
            <p className="text-gray-600 mt-1">
              Totals from cached Webflow orders, by product and SKU.{' '}
              <Link href="/admin/checkin" className="text-blue-600 hover:text-blue-800 font-medium">
                Player check-in →
              </Link>
            </p>
          </div>
          <button type="button" onClick={handleLogout} className="btn btn-secondary flex items-center gap-2 shrink-0">
            <LogOut size={18} />
            Logout
          </button>
        </div>

        <div className="card">
          <EventTicketCounts webflowConfigured={Boolean(meta?.webflowConfigured)} />
        </div>
      </div>
    </div>
  );
}
