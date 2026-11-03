import type { Dashboard, DashboardWidget, Transaction } from '../../generated/prisma/client';
import type {
  DashboardView,
  SpanInput,
  TransactionView,
  WidgetView,
} from '../interfaces/performance.interfaces';

export class PerformanceMapper {
  static toTransactionView(transaction: Transaction): TransactionView {
    return {
      id: transaction.id,
      eventId: transaction.eventId,
      traceId: transaction.traceId,
      name: transaction.name,
      op: transaction.op,
      status: transaction.status,
      timestamp: transaction.timestamp.toISOString(),
      durationMs: transaction.durationMs,
      release: transaction.release,
      environment: transaction.environment,
      spans: transaction.spans as unknown as SpanInput[],
      tags: transaction.tags as Record<string, string>,
    };
  }

  static toWidgetView(widget: DashboardWidget): WidgetView {
    return {
      id: widget.id,
      title: widget.title,
      source: widget.source,
      metricName: widget.metricName,
      filterName: widget.filterName,
      aggregation: widget.aggregation,
      display: widget.display,
      position: widget.position,
    };
  }

  static toDashboardView(dashboard: Dashboard & { widgets: DashboardWidget[] }): DashboardView {
    return {
      id: dashboard.id,
      projectId: dashboard.projectId,
      name: dashboard.name,
      widgets: dashboard.widgets.map(PerformanceMapper.toWidgetView),
      createdAt: dashboard.createdAt.toISOString(),
    };
  }
}
