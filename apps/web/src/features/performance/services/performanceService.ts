import { BaseApiClient } from '@/services/BaseApiClient';
import type {
  Dashboard,
  MetricName,
  PerfRange,
  Series,
  SeriesParams,
  Transaction,
  TransactionPage,
  TransactionSummary,
  Widget,
  WidgetInput,
} from '../types/performance.types';

const PAGE_SIZE = 25;

class PerformanceService extends BaseApiClient {
  summarize(projectId: string, range: PerfRange): Promise<TransactionSummary[]> {
    return this.get(`/projects/${projectId}/transactions/summary?range=${range}`);
  }

  listTransactions(projectId: string, name: string | undefined, page: number): Promise<TransactionPage> {
    const query = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (name) query.set('name', name);
    return this.get(`/projects/${projectId}/transactions?${query.toString()}`);
  }

  getTransaction(transactionId: string): Promise<Transaction> {
    return this.get(`/transactions/${transactionId}`);
  }

  listMetrics(projectId: string): Promise<MetricName[]> {
    return this.get(`/projects/${projectId}/metrics`);
  }

  series(projectId: string, params: SeriesParams): Promise<Series> {
    const query = new URLSearchParams({
      source: params.source,
      aggregation: params.aggregation,
      range: params.range,
    });
    if (params.name) query.set('name', params.name);
    return this.get(`/projects/${projectId}/series?${query.toString()}`);
  }

  listDashboards(projectId: string): Promise<Dashboard[]> {
    return this.get(`/projects/${projectId}/dashboards`);
  }

  createDashboard(projectId: string, name: string): Promise<Dashboard> {
    return this.post(`/projects/${projectId}/dashboards`, { name });
  }

  removeDashboard(dashboardId: string): Promise<void> {
    return this.delete(`/dashboards/${dashboardId}`);
  }

  addWidget(dashboardId: string, input: WidgetInput): Promise<Widget> {
    return this.post(`/dashboards/${dashboardId}/widgets`, input);
  }

  removeWidget(widgetId: string): Promise<void> {
    return this.delete(`/widgets/${widgetId}`);
  }
}

export const performanceService = new PerformanceService();
export const TRANSACTIONS_PAGE_SIZE = PAGE_SIZE;
