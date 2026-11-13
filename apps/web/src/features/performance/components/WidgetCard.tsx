import { GripVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AGGREGATION_OPTIONS } from '../constants/performance.constants';
import { useSeries } from '../hooks/usePerformanceQueries';
import type { PerfRange, Widget } from '../types/performance.types';
import { PerformanceUtils } from '../utils/performance.utils';
import { GroupTable } from './GroupTable';
import { SeriesChart } from './SeriesChart';

interface WidgetCardProps {
  projectId: string;
  widget: Widget;
  range: PerfRange;
  editing: boolean;
  onRemove: (widget: Widget) => void;
}

export function WidgetCard({ projectId, widget, range, editing, onRemove }: WidgetCardProps) {
  const name =
    widget.source === 'METRIC'
      ? (widget.metricName ?? undefined)
      : (widget.filterName ?? undefined);
  const isDuration = widget.source === 'TRANSACTIONS';
  const { data, isLoading, error } = useSeries(projectId, {
    source: widget.source,
    name,
    aggregation: widget.aggregation,
    range,
    groupBy: widget.display === 'NUMBER' ? undefined : (widget.groupBy ?? undefined),
    tag:
      widget.tagKey && widget.tagValue ? { key: widget.tagKey, value: widget.tagValue } : undefined,
  });
  const aggregationLabel = AGGREGATION_OPTIONS.find(
    (option) => option.value === widget.aggregation,
  )?.label;
  const subject =
    widget.source === 'METRIC'
      ? widget.metricName
      : widget.source === 'ERRORS'
        ? 'errors'
        : (widget.filterName ?? 'All transactions');

  return (
    <section
      className={`flex h-full min-w-0 flex-col rounded-xl border bg-card p-4 ${editing ? 'border-dashed ring-1 ring-primary/30' : ''}`}
      aria-label={widget.title}
    >
      <header className="mb-3 flex shrink-0 items-start justify-between gap-2">
        <div
          className={`flex min-w-0 flex-1 items-start gap-1.5 ${editing ? 'widget-drag cursor-grab touch-none select-none active:cursor-grabbing' : ''}`}
        >
          {editing && (
            <GripVertical className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          )}
          <div className="min-w-0">
          <h3 className="truncate font-semibold">{widget.title}</h3>
          <p className="truncate text-xs text-muted-foreground">
            {aggregationLabel} of <span className="font-mono">{subject}</span>
            {widget.groupBy && widget.display !== 'NUMBER' && (
              <>
                {' '}
                by <span className="font-mono">{widget.groupBy}</span>
              </>
            )}
            {widget.tagKey && (
              <>
                {' '}
                where{' '}
                <span className="font-mono">
                  {widget.tagKey}={widget.tagValue}
                </span>
              </>
            )}
          </p>
          </div>
        </div>
        {editing && (
          <Button
            variant="ghost"
            size="icon"
            className="-mr-2 -mt-1 shrink-0"
            aria-label={`Remove ${widget.title}`}
            onClick={() => onRemove(widget)}
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </header>
      {isLoading && <Skeleton className="h-full min-h-24 w-full" />}
      {error && <p className="text-sm text-destructive">{error.message}</p>}
      {data && widget.display === 'NUMBER' && (
        <div className="grid min-h-0 flex-1 place-items-center">
          <p className="font-display text-5xl font-semibold tabular">
            {PerformanceUtils.value(data.total, isDuration, widget.aggregation)}
          </p>
        </div>
      )}
      {data && widget.display === 'TABLE' && (
        <div className="min-h-0 flex-1">
          <GroupTable
            groups={data.groups ?? [{ key: 'All', points: data.points, total: data.total }]}
            groupLabel={widget.groupBy ?? 'Group'}
            aggregation={widget.aggregation}
            isDuration={isDuration}
          />
        </div>
      )}
      {data && (widget.display === 'LINE' || widget.display === 'BAR') && (
        <div className="min-h-0 flex-1">
          <SeriesChart
            series={data}
            range={range}
            aggregation={widget.aggregation}
            isDuration={isDuration}
            kind={widget.display}
            height="h-full"
          />
        </div>
      )}
    </section>
  );
}
