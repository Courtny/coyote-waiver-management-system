'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EventTicketCounts } from '@/components/checkin/EventTicketCounts';
import AdminPageShell from '@/components/admin/AdminPageShell';
import type { CheckinEventOption } from '@/lib/checkin-config';

type Meta = {
  currentYear: number;
  events: CheckinEventOption[];
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <AdminPageShell
      title="Event ticket counts"
      backHref="/admin/dashboard"
      description={
        <>
          Totals from cached Webflow orders, by product and SKU.{' '}
          <Link href="/admin/checkin" className="font-medium text-blue-600 hover:text-blue-800">
            Player check-in →
          </Link>
        </>
      }
    >
      <div className="card">
        <EventTicketCounts
          webflowConfigured={Boolean(meta?.webflowConfigured)}
          checkinEvents={meta?.events}
        />
      </div>
    </AdminPageShell>
  );
}
