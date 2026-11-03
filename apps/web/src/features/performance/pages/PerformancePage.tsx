import { Gauge } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Format } from '@/lib/format';
import { cn } from '@/lib/utils';
import { SeriesChart } from '../components/SeriesChart';
import { SpanWaterfall } from '../components/SpanWaterfall';
import { PERF_RANGES } from '../constants/performance.constants';
import { useSeries, useTransaction, useTransactions, useTransactionSummary } from '../hooks/usePerformanceQueries';
import type { PerfRange } from '../types/performance.types';
import { PerformanceUtils } from '../utils/performance.utils';

export function PerformancePage() {
  const { projectId = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const selected = params.get('name') ?? undefined;
  const [range, setRange] = useState<PerfRange>('24h');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: summary, isLoading, error, refetch } = useTransactionSummary(projectId, range);

  if (error) {
    return <ErrorState message={error.message} onRetry={() => void refetch()} />;
  }

  const select = (name: string | undefined): void => {
    setSelectedId(null);
    setParams(name ? { name } : {});
  };

  return (
    <>
      <PageHeader
        title="Performance"
        description="How long your endpoints and jobs take, and where the time goes."
        actions={
          <Tabs value={range} onValueChange={(value) => setRange(value as PerfRange)}>
            <TabsList>
              {PERF_RANGES.map((item) => (
                <TabsTrigger key={item.value} value={item.value}>
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        }
      />

      {isLoading && <Skeleton className="h-64 w-full" />}

      {summary && summary.length === 0 && (
        <EmptyState
          icon={Gauge}
          title="No transactions yet"
          description="Wrap a request or job with startTransaction() in your SDK. Durations, percentiles and span waterfalls show up here."
          action={
            <Button asChild variant="outline">
              <Link to={`/projects/${projectId}/settings`}>Open setup guide</Link>
            </Button>
          }
        />
      )}

      {summary && summary.length > 0 && (
        <div className="grid gap-8">
          <section aria-labelledby="latency-chart" className="grid gap-3">
            <h2 id="latency-chart" className="text-lg font-semibold">
              p95 latency{selected ? <span className="ml-2 font-mono text-sm font-normal text-muted-foreground">{selected}</span> : ' across all transactions'}
            </h2>
            <LatencyChart projectId={projectId} range={range} name={selected} />
          </section>

          <section aria-labelledby="transactions-table">
            <h2 id="transactions-table" className="mb-3 text-lg font-semibold">
              Transactions
            </h2>
            <div className="overflow-x-auto rounded-xl border bg-card">
              <table className="w-full min-w-[40rem] text-sm">
                <thead className="border-b text-left text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Name</th>
                    <th className="px-4 py-2.5 text-right font-medium">Count</th>
                    <th className="px-4 py-2.5 text-right font-medium">Avg</th>
                    <th className="px-4 py-2.5 text-right font-medium">p50</th>
                    <th className="px-4 py-2.5 text-right font-medium">p95</th>
                    <th className="px-4 py-2.5 text-right font-medium">Failure</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {summary.map((row) => (
                    <tr key={row.name} className={cn('cursor-pointer hover:bg-muted/50', selected === row.name && 'bg-muted/60')}>
                      <td className="max-w-[18rem] px-4 py-2.5">
                        <button type="button" className="block w-full truncate text-left font-medium" onClick={() => select(selected === row.name ? undefined : row.name)}>
                          {row.name}
                        </button>
                        <span className="font-mono text-xs text-muted-foreground">{row.op}</span>
                      </td>
                      <td className="tabular px-4 py-2.5 text-right">{Format.number(row.count)}</td>
                      <td className="tabular px-4 py-2.5 text-right">{PerformanceUtils.duration(row.avgMs)}</td>
                      <td className="tabular px-4 py-2.5 text-right">{PerformanceUtils.duration(row.p50Ms)}</td>
                      <td className="tabular px-4 py-2.5 text-right font-medium">{PerformanceUtils.duration(row.p95Ms)}</td>
                      <td className="tabular px-4 py-2.5 text-right">
                        {row.failureRate > 0 ? <Badge variant="destructive">{PerformanceUtils.percent(row.failureRate)}</Badge> : <span className="text-muted-foreground">0%</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {selected && (
            <RecentTransactions projectId={projectId} name={selected} selectedId={selectedId} onSelect={setSelectedId} />
          )}
        </div>
      )}
    </>
  );
}

function LatencyChart({ projectId, range, name }: { projectId: string; range: PerfRange; name?: string }) {
  const { data, isLoading } = useSeries(projectId, { source: 'TRANSACTIONS', name, aggregation: 'P95', range });
  if (isLoading || !data) return <Skeleton className="h-56 w-full" />;
  return <SeriesChart series={data} range={range} aggregation="P95" isDuration kind="LINE" />;
}

interface RecentTransactionsProps {
  projectId: string;
  name: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function RecentTransactions({ projectId, name, selectedId, onSelect }: RecentTransactionsProps) {
  const { data } = useTransactions(projectId, name, 1);
  const activeId = selectedId ?? data?.items[0]?.id ?? null;
  const { data: active } = useTransaction(activeId);

  return (
    <section aria-labelledby="recent-transactions" className="grid gap-4">
      <h2 id="recent-transactions" className="text-lg font-semibold">
        Recent runs
      </h2>
      <ul className="flex gap-2 overflow-x-auto pb-1">
        {data?.items.slice(0, 12).map((item) => (
          <li key={item.id}>
            <Button
              variant={item.id === activeId ? 'default' : 'outline'}
              size="sm"
              className="tabular whitespace-nowrap"
              onClick={() => onSelect(item.id)}
              aria-pressed={item.id === activeId}
            >
              {PerformanceUtils.duration(item.durationMs)} · {Format.relativeTime(item.timestamp)}
            </Button>
          </li>
        ))}
      </ul>
      {active && (
        <div className="grid gap-4 rounded-xl border bg-card p-4">
          <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <Detail label="Duration" value={PerformanceUtils.duration(active.durationMs)} />
            <Detail label="Status" value={active.status} />
            <Detail label="Release" value={active.release ?? '—'} mono />
            <Detail label="Environment" value={active.environment ?? '—'} />
            <Detail label="Trace" value={active.traceId.slice(0, 8)} mono />
          </dl>
          <SpanWaterfall transaction={active} />
        </div>
      )}
    </section>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn('font-medium', mono && 'font-mono text-xs')}>{value}</dd>
    </div>
  );
}
