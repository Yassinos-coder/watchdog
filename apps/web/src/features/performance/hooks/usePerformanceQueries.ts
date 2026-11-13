import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';
import { useAuthSession } from '@/features/auth/hooks/useAuthQueries';
import { performanceService } from '../services/performanceService';
import type { PerfRange, SeriesParams, SeriesSource } from '../types/performance.types';
import { DashboardCache } from '../utils/dashboardCache';

export const performanceKeys = {
  summary: (projectId: string, range: PerfRange) =>
    ['performance', projectId, 'summary', range] as const,
  transactions: (projectId: string, name: string | undefined, page: number) =>
    ['performance', projectId, 'transactions', name ?? null, page] as const,
  transaction: (transactionId: string) => ['performance', 'transaction', transactionId] as const,
  metrics: (projectId: string) => ['performance', projectId, 'metrics'] as const,
  series: (projectId: string, params: SeriesParams) =>
    ['performance', projectId, 'series', params] as const,
  tagKeys: (projectId: string, source: SeriesSource, name: string | undefined) =>
    ['performance', projectId, 'tag-keys', source, name ?? null] as const,
  dashboards: (projectId: string) => ['performance', projectId, 'dashboards'] as const,
};

export function useTransactionSummary(projectId: string, range: PerfRange) {
  return useQuery({
    queryKey: performanceKeys.summary(projectId, range),
    queryFn: () => performanceService.summarize(projectId, range),
    refetchInterval: 30_000,
  });
}

export function useTransactions(projectId: string, name: string | undefined, page: number) {
  return useQuery({
    queryKey: performanceKeys.transactions(projectId, name, page),
    queryFn: () => performanceService.listTransactions(projectId, name, page),
    placeholderData: keepPreviousData,
  });
}

export function useTransaction(transactionId: string | null) {
  return useQuery({
    queryKey: performanceKeys.transaction(transactionId ?? ''),
    queryFn: () => performanceService.getTransaction(transactionId!),
    enabled: Boolean(transactionId),
  });
}

export function useMetricNames(projectId: string) {
  return useQuery({
    queryKey: performanceKeys.metrics(projectId),
    queryFn: () => performanceService.listMetrics(projectId),
  });
}

export function useSeries(projectId: string, params: SeriesParams, enabled = true) {
  return useQuery({
    queryKey: performanceKeys.series(projectId, params),
    queryFn: () => performanceService.series(projectId, params),
    enabled,
    refetchInterval: 30_000,
  });
}

export function useTagKeys(
  projectId: string,
  source: SeriesSource,
  name: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: performanceKeys.tagKeys(projectId, source, name),
    queryFn: () => performanceService.tagKeys(projectId, source, name),
    enabled,
  });
}

export const dashboardsQueryOptions = (projectId: string, userId: string | undefined) => {
  const cached = DashboardCache.read(userId, projectId);
  return queryOptions({
    queryKey: performanceKeys.dashboards(projectId),
    queryFn: async () => {
      const dashboards = await performanceService.listDashboards(projectId);
      DashboardCache.write(userId, projectId, dashboards);
      return dashboards;
    },
    initialData: cached?.data,
    initialDataUpdatedAt: cached?.savedAt,
  });
};

export function useDashboards(projectId: string) {
  const { data: session } = useAuthSession();
  return useQuery(dashboardsQueryOptions(projectId, session?.user?.id));
}
