import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AGGREGATION_OPTIONS } from '../constants/performance.constants';
import { useSeries } from '../hooks/usePerformanceQueries';
import type { PerfRange, Widget } from '../types/performance.types';
import { PerformanceUtils } from '../utils/performance.utils';
import { SeriesChart } from './SeriesChart';

interface WidgetCardProps {
  projectId: string;
  widget: Widget;
  range: PerfRange;
  canManage: boolean;
  onRemove: (widget: Widget) => void;
}

export function WidgetCard({ projectId, widget, range, canManage, onRemove }: WidgetCardProps) {
  const name = widget.source === 'METRIC' ? (widget.metricName ?? undefined) : (widget.filterName ?? undefined);
  const isDuration = widget.source === 'TRANSACTIONS';
  const { data, isLoading, error } = useSeries(projectId, {
    source: widget.source,
    name,
    aggregation: widget.aggregation,
    range,
  });
  const aggregationLabel = AGGREGATION_OPTIONS.find((option) => option.value === widget.aggregation)?.label;
  const subject = widget.source === 'METRIC' ? widget.metricName : (widget.filterName ?? 'All transactions');

  return (
    <section className="flex min-w-0 flex-col rounded-xl border bg-card p-4" aria-label={widget.title}>
      <header className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-semibold">{widget.title}</h3>
          <p className="truncate text-xs text-muted-foreground">
            {aggregationLabel} of <span className="font-mono">{subject}</span>
          </p>
        </div>
        {canManage && (
          <Button variant="ghost" size="icon" className="-mr-2 -mt-1 shrink-0" aria-label={`Remove ${widget.title}`} onClick={() => onRemove(widget)}>
            <Trash2 className="size-4" />
          </Button>
        )}
      </header>
      {isLoading && <Skeleton className="h-40 w-full" />}
      {error && <p className="text-sm text-destructive">{error.message}</p>}
      {data && widget.display === 'NUMBER' && (
        <p className="font-display text-5xl font-semibold tabular">
          {PerformanceUtils.value(data.total, isDuration, widget.aggregation)}
        </p>
      )}
      {data && widget.display !== 'NUMBER' && (
        <SeriesChart
          series={data}
          range={range}
          aggregation={widget.aggregation}
          isDuration={isDuration}
          kind={widget.display}
          height="h-44"
        />
      )}
    </section>
  );
}
