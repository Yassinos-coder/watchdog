import { Radar } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Format } from '@/lib/format';
import { SetupGuide } from '@/features/projects/components/SetupGuide';
import { useProject } from '@/features/projects/hooks/useProjectQueries';
import { IssueRow } from '../components/IssueRow';
import { useIssues, useProjectStats } from '../hooks/useIssueQueries';
import type { StatsRange } from '../types/issue.types';
import { SeriesUtils } from '../utils/series.utils';

const RANGES: { value: StatsRange; label: string }[] = [
  { value: '24h', label: '24 hours' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
];

const CHART_CONFIG = { count: { label: 'Events', color: 'var(--chart-1)' } } satisfies ChartConfig;

export function ProjectOverviewPage() {
  const { projectId = '' } = useParams();
  const [range, setRange] = useState<StatsRange>('24h');
  const { data: project } = useProject(projectId);
  const { data: stats, isLoading, error, refetch } = useProjectStats(projectId, range);
  const { data: recent } = useIssues(projectId, { status: 'UNRESOLVED', sort: 'lastSeen', page: 1 });

  if (error) {
    return <ErrorState message={error.message} onRetry={() => void refetch()} />;
  }

  const series = stats ? SeriesUtils.fill(stats.series, range) : [];
  const waiting = stats && recent && recent.total === 0 && stats.totalEvents === 0;

  return (
    <>
      <PageHeader
        title={project?.name ?? 'Overview'}
        description="How your app is doing right now."
        actions={
          <Tabs value={range} onValueChange={(value) => setRange(value as StatsRange)}>
            <TabsList>
              {RANGES.map((item) => (
                <TabsTrigger key={item.value} value={item.value}>
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        }
      />

      {waiting && project ? (
        <div className="grid gap-6">
          <EmptyState
            icon={Radar}
            title="Waiting for the first event"
            description="Add Watchdog to your app with the snippet below. This page updates on its own when an error arrives."
          />
          <SetupGuide project={project} />
        </div>
      ) : (
        <div className="grid gap-10">
          <dl className="grid grid-cols-1 divide-y rounded-xl border bg-card sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <Figure label={`Events in ${RANGES.find((item) => item.value === range)?.label}`} value={stats?.totalEvents} loading={isLoading} />
            <Figure label="Unresolved issues" value={stats?.unresolvedIssues} loading={isLoading} />
            <Figure label="New issues" value={stats?.newIssues} loading={isLoading} />
          </dl>

          <section aria-labelledby="events-chart">
            <h2 id="events-chart" className="mb-3 text-lg font-semibold">
              Events over time
            </h2>
            {isLoading ? (
              <Skeleton className="h-56 w-full" />
            ) : (
              <ChartContainer config={CHART_CONFIG} className="aspect-auto h-56 w-full">
                <AreaChart data={series} margin={{ left: 0, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="fillEvents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-count)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--color-count)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="bucket"
                    tickLine={false}
                    axisLine={false}
                    minTickGap={32}
                    tickFormatter={(value: string) => (range === '24h' ? Format.hour(value) : Format.shortDate(value))}
                  />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) =>
                          range === '24h' ? Format.dateTime(String(value)) : Format.shortDate(String(value))
                        }
                      />
                    }
                  />
                  <Area dataKey="count" type="monotone" stroke="var(--color-count)" strokeWidth={2} fill="url(#fillEvents)" />
                </AreaChart>
              </ChartContainer>
            )}
          </section>

          <div className="grid gap-8 md:grid-cols-2">
            <Breakdown
              title="Top releases"
              emptyText="No releases reported yet. Set the release option in your SDK."
              rows={stats?.topReleases.map((item) => ({ label: item.release, count: item.count, mono: true })) ?? []}
              loading={isLoading}
            />
            <Breakdown
              title="Environments"
              emptyText="No environments reported yet."
              rows={stats?.topEnvironments.map((item) => ({ label: item.environment, count: item.count })) ?? []}
              loading={isLoading}
            />
          </div>

          <section aria-labelledby="recent-issues">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="recent-issues" className="text-lg font-semibold">
                Recent unresolved issues
              </h2>
              <Button asChild variant="ghost" size="sm">
                <Link to={`/projects/${projectId}/issues`}>View all</Link>
              </Button>
            </div>
            {recent && recent.items.length === 0 ? (
              <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                No unresolved issues.
              </p>
            ) : (
              <ul className="divide-y overflow-hidden rounded-xl border bg-card">
                {recent?.items.slice(0, 5).map((issue) => <IssueRow key={issue.id} issue={issue} />)}
              </ul>
            )}
          </section>
        </div>
      )}
    </>
  );
}

function Figure({ label, value, loading }: { label: string; value?: number; loading: boolean }) {
  return (
    <div className="px-5 py-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-display text-4xl font-semibold tabular">
        {loading || value === undefined ? <Skeleton className="h-10 w-20" /> : Format.number(value)}
      </dd>
    </div>
  );
}

interface BreakdownRow {
  label: string;
  count: number;
  mono?: boolean;
}

function Breakdown({ title, rows, emptyText, loading }: { title: string; rows: BreakdownRow[]; emptyText: string; loading: boolean }) {
  const max = Math.max(...rows.map((row) => row.count), 1);

  return (
    <section aria-label={title}>
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {loading && <Skeleton className="h-28 w-full" />}
      {!loading && rows.length === 0 && <p className="text-sm text-muted-foreground">{emptyText}</p>}
      <ul className="grid gap-3">
        {rows.map((row) => (
          <li key={row.label} className="grid gap-1">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className={row.mono ? 'truncate font-mono text-xs' : 'truncate'}>{row.label}</span>
              <span className="tabular shrink-0 text-muted-foreground">{Format.number(row.count)}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-chart-1" style={{ width: `${(row.count / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
