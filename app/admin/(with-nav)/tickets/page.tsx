'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EventTicketCounts } from '@/components/checkin/EventTicketCounts';
import { EventsConfigBanner } from '@/components/checkin/EventsConfigBanner';
import AdminPageShell from '@/components/admin/AdminPageShell';
import type { EventsConfigStatus } from '@/lib/checkin-config';

type Meta = {
  currentYear: number;
  events: { id: string; label: string }[];
  eventsConfig?: EventsConfigStatus;
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
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
          <Link href="/admin/checkin" className="font-medium text-link underline underline-offset-4 hover:text-link-hover">
            Player check-in →
          </Link>
        </>
      }
    >
      {meta && (
        <EventsConfigBanner
          webflowConfigured={meta.webflowConfigured}
          eventsCount={meta.events?.length ?? 0}
          eventsConfig={meta.eventsConfig}
        />
      )}
      <div className="rounded border border-border bg-card p-6">
        <EventTicketCounts webflowConfigured={Boolean(meta?.webflowConfigured)} />
      </div>
    </AdminPageShell>
  );
}
