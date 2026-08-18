'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@coyote-force/ui';
import {
  ChartContainer,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@coyote-force/ui/chart';
import { Bar, BarChart, CartesianGrid, Legend, XAxis } from 'recharts';
import type { WaiverRegistrationStats } from '@/lib/waiver-registration-stats';

function formatChartDate(value: string): string {
  const date = new Date(`${value}T12:00:00`);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatSignedDate(value: string): string {
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return 'Invalid date';
  }
}

function Stat({ label, value, loading }: { label: string; value: number; loading: boolean }) {
  return (
    <div className="text-right">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold tabular-nums leading-tight">
        {loading ? <Skeleton className="ml-auto h-6 w-10" /> : value}
      </div>
    </div>
  );
}

export default function WaiverRegistrationOverview() {
  const router = useRouter();
  const [stats, setStats] = useState<WaiverRegistrationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const currentYear = new Date().getFullYear();

  const chartConfig = useMemo(
    () =>
      ({
        currentYear: {
          label: String(currentYear),
          color: 'var(--chart-1)',
        },
        priorYears: {
          label: 'Prior years',
          color: 'var(--chart-2)',
        },
      }) satisfies ChartConfig,
    [currentYear]
  );

  useEffect(() => {
    let mounted = true;

    const loadStats = async () => {
      setIsLoading(true);
      setError('');

      try {
        const response = await fetch('/api/admin/waivers/stats');

        if (response.status === 401) {
          router.push('/admin/login');
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to load registration stats');
        }

        const data = (await response.json()) as WaiverRegistrationStats;
        if (mounted) {
          setStats(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'An error occurred');
          setStats(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void loadStats();
    return () => {
      mounted = false;
    };
  }, [router]);

  if (error) {
    return (
      <div className="mb-4 rounded border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="mb-4 overflow-hidden rounded border border-border bg-card">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h2 className="font-heading text-base font-semibold text-foreground">Registrations</h2>
          <p className="text-xs text-muted-foreground">Last 30 days, Eastern Time</p>
        </div>
        <div className="flex gap-5">
          <Stat label="Today" value={stats?.today ?? 0} loading={isLoading} />
          <Stat label="7 days" value={stats?.last7Days ?? 0} loading={isLoading} />
          <Stat label="30 days" value={stats?.last30Days ?? 0} loading={isLoading} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3">
        <div className="border-b border-border p-3 lg:col-span-2 lg:border-b-0 lg:border-r">
          {isLoading ? (
            <Skeleton className="h-[160px] w-full" />
          ) : (
            <ChartContainer config={chartConfig} className="aspect-auto h-[160px] w-full">
              <BarChart accessibilityLayer data={stats?.daily ?? []} margin={{ left: 0, right: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={6}
                  minTickGap={28}
                  tick={{ fontSize: 11 }}
                  tickFormatter={formatChartDate}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) =>
                        typeof value === 'string' ? formatChartDate(value) : String(value)
                      }
                    />
                  }
                />
                <Legend content={<ChartLegendContent />} />
                <Bar
                  dataKey="currentYear"
                  stackId="registrations"
                  fill="var(--color-currentYear)"
                  radius={[0, 0, 3, 3]}
                />
                <Bar
                  dataKey="priorYears"
                  stackId="registrations"
                  fill="var(--color-priorYears)"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </div>

        <div className="p-3">
          <div className="mb-2 text-xs font-medium text-muted-foreground">Latest waivers</div>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }, (_, index) => (
                <Skeleton key={index} className="h-7 w-full" />
              ))}
            </div>
          ) : stats?.latest.length ? (
            <ul className="divide-y divide-border">
              {stats.latest.slice(0, 6).map((waiver) => (
                <li key={waiver.id}>
                  <Link
                    href={`/admin/waivers/${waiver.id}`}
                    className="flex items-baseline justify-between gap-2 py-1.5 text-sm hover:text-link-hover"
                  >
                    <span className="truncate font-medium">
                      {waiver.firstName} {waiver.lastName}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatSignedDate(waiver.signatureDate)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No waivers submitted yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
