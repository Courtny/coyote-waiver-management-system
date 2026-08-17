'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@coyote-force/ui';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@coyote-force/ui/chart';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import type { WaiverRegistrationStats } from '@/lib/waiver-registration-stats';

const chartConfig = {
  count: {
    label: 'Registrations',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

function formatChartDate(value: string): string {
  const date = new Date(`${value}T12:00:00`);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatSignedDate(value: string): string {
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'Invalid date';
  }
}

function KpiCard({ label, value, loading }: { label: string; value: number; loading: boolean }) {
  return (
    <Card size="sm">
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl font-semibold tabular-nums">
          {loading ? <Skeleton className="h-9 w-16" /> : value}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}

export default function WaiverRegistrationOverview() {
  const router = useRouter();
  const [stats, setStats] = useState<WaiverRegistrationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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
      <div className="mb-6 rounded border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="mb-6 space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Today" value={stats?.today ?? 0} loading={isLoading} />
        <KpiCard label="Last 7 days" value={stats?.last7Days ?? 0} loading={isLoading} />
        <KpiCard label="Last 30 days" value={stats?.last30Days ?? 0} loading={isLoading} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Registrations (last 30 days)</CardTitle>
            <CardDescription>Daily waiver submissions in Eastern Time</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="aspect-auto h-[250px] w-full" />
            ) : (
              <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
                <AreaChart accessibilityLayer data={stats?.daily ?? []} margin={{ left: 12, right: 12 }}>
                  <defs>
                    <linearGradient id="fillRegistrations" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-count)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--color-count)" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={32}
                    tickFormatter={formatChartDate}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        indicator="dot"
                        labelFormatter={(value) =>
                          typeof value === 'string' ? formatChartDate(value) : String(value)
                        }
                      />
                    }
                  />
                  <Area
                    dataKey="count"
                    type="natural"
                    fill="url(#fillRegistrations)"
                    stroke="var(--color-count)"
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latest waivers</CardTitle>
            <CardDescription>Most recently signed</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 8 }, (_, index) => (
                  <Skeleton key={index} className="h-10 w-full" />
                ))}
              </div>
            ) : stats?.latest.length ? (
              <ul className="divide-y divide-border">
                {stats.latest.map((waiver) => (
                  <li key={waiver.id} className="py-3 first:pt-0 last:pb-0">
                    <Link
                      href={`/admin/waivers/${waiver.id}`}
                      className="group block"
                    >
                      <div className="font-medium text-foreground group-hover:text-link-hover">
                        {waiver.firstName} {waiver.lastName}
                      </div>
                      <div className="mt-0.5 text-sm text-muted-foreground">
                        {formatSignedDate(waiver.signatureDate)}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No waivers submitted yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
