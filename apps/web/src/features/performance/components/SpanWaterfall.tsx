import { cn } from '@/lib/utils';
import type { Transaction } from '../types/performance.types';
import { PerformanceUtils } from '../utils/performance.utils';

interface SpanWaterfallProps {
  transaction: Transaction;
}

export function SpanWaterfall({ transaction }: SpanWaterfallProps) {
  const rows = PerformanceUtils.layout(transaction.spans, transaction.durationMs);

  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        This transaction has no spans. Wrap slow work with <code className="font-mono">transaction.startSpan()</code> to see where time goes.
      </p>
    );
  }

  return (
    <ol className="grid gap-1.5" aria-label="Spans">
      {rows.map(({ span, left, width, depth }) => (
        <li key={span.spanId} className="grid gap-1 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_5rem] sm:items-center sm:gap-3">
          <div className="min-w-0" style={{ paddingLeft: `${Math.min(depth, 6) * 12}px` }}>
            <span className="font-mono text-xs font-medium">{span.op}</span>
            {span.description && (
              <span className="ml-2 truncate text-xs text-muted-foreground" title={span.description}>
                {span.description}
              </span>
            )}
          </div>
          <div className="relative h-5 rounded bg-muted">
            <div
              className={cn('absolute inset-y-0 rounded', span.status === 'ok' ? 'bg-chart-1' : 'bg-destructive')}
              style={{ left: `${left}%`, width: `${Math.min(width, 100 - left)}%` }}
            />
          </div>
          <span className="tabular text-xs text-muted-foreground sm:text-right">
            {PerformanceUtils.duration(span.durationMs)}
          </span>
        </li>
      ))}
    </ol>
  );
}
