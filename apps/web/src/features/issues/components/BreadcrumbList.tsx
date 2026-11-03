import { Format } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Breadcrumb } from '../types/issue.types';

interface BreadcrumbListProps {
  breadcrumbs: Breadcrumb[];
  eventTime: string;
}

const LEVEL_DOT: Record<string, string> = {
  error: 'bg-signal',
  warning: 'bg-lantern',
  info: 'bg-chart-1',
  debug: 'bg-muted-foreground',
};

export function BreadcrumbList({ breadcrumbs, eventTime }: BreadcrumbListProps) {
  if (breadcrumbs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No breadcrumbs were recorded. Clicks, navigation, console output and network calls appear here when
        the browser SDK is installed.
      </p>
    );
  }
  const end = new Date(eventTime).getTime();

  return (
    <ol className="relative grid gap-0 border-l pl-5">
      {[...breadcrumbs].reverse().map((crumb, index) => {
        const offset = Math.max(Math.round((end - new Date(crumb.timestamp).getTime()) / 100) / 10, 0);
        return (
          <li key={`${crumb.timestamp}-${index}`} className="relative pb-4 last:pb-0">
            <span
              className={cn(
                'absolute -left-[26px] top-1.5 size-2.5 rounded-full ring-4 ring-background',
                LEVEL_DOT[crumb.level ?? 'info'] ?? 'bg-chart-1',
              )}
            />
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
              <span className="text-sm font-medium">{crumb.category ?? crumb.type ?? 'event'}</span>
              <span className="tabular text-xs text-muted-foreground">
                {offset === 0 ? 'at the error' : `${offset}s before`} · {Format.hour(crumb.timestamp)}
              </span>
            </div>
            {crumb.message && <p className="mt-0.5 break-words font-mono text-xs">{crumb.message}</p>}
            {crumb.data && Object.keys(crumb.data).length > 0 && (
              <p className="mt-0.5 break-all font-mono text-xs text-muted-foreground">
                {Object.entries(crumb.data)
                  .map(([key, value]) => `${key}=${typeof value === 'string' ? value : JSON.stringify(value)}`)
                  .join('  ')}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
