import { DocsLink } from '@/components/DocsLink';
import { ErrorState } from '@/components/ErrorState';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { useInstance } from '../hooks/useSettingsQueries';

const ROWS = [
  { key: 'eventDays', label: 'Errors and issues', note: 'Error events, and issues not seen within the period.' },
  { key: 'performanceDays', label: 'Transactions and raw metrics', note: 'Traces and individual metric points.' },
  { key: 'rollupDays', label: 'Metric rollups', note: 'Hourly summaries behind the 7, 30 and 90 day charts.' },
  { key: 'replayDays', label: 'Session replays', note: 'Recordings of what users did.' },
] as const;

const days = (value: number): string => (value === 0 ? 'Kept forever' : `${value} ${value === 1 ? 'day' : 'days'}`);

export function DataPage() {
  const { data: instance, isLoading, error, refetch } = useInstance();

  return (
    <>
      <PageHeader
        title="Data and retention"
        description="How long Watchdog keeps what your apps send. Old data is deleted automatically."
      />
      {isLoading && <Skeleton className="h-48 w-full" />}
      {error && <ErrorState message={error.message} onRetry={() => void refetch()} />}
      {instance && (
        <div className="grid max-w-3xl gap-4">
          <ul className="divide-y overflow-hidden rounded-xl border bg-card">
            {ROWS.map((row) => (
              <li key={row.key} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="font-medium">{row.label}</p>
                  <p className="text-sm text-muted-foreground">{row.note}</p>
                </div>
                <p className="shrink-0 text-sm font-medium tabular">{days(instance.retention[row.key])}</p>
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">
            These come from environment variables on your server, such as <span className="font-mono">RETENTION_EVENT_DAYS</span>.{' '}
            <DocsLink path="retention">How retention works</DocsLink>
          </p>
        </div>
      )}
    </>
  );
}
