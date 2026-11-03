import { useMutation, useQueryClient } from '@tanstack/react-query';
import { performanceService } from '../services/performanceService';
import type { WidgetInput } from '../types/performance.types';
import { performanceKeys } from './usePerformanceQueries';

export function useCreateDashboard(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => performanceService.createDashboard(projectId, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: performanceKeys.dashboards(projectId) }),
  });
}

export function useRemoveDashboard(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dashboardId: string) => performanceService.removeDashboard(dashboardId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: performanceKeys.dashboards(projectId) }),
  });
}

export function useAddWidget(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { dashboardId: string; widget: WidgetInput }) =>
      performanceService.addWidget(input.dashboardId, input.widget),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: performanceKeys.dashboards(projectId) }),
  });
}

export function useRemoveWidget(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (widgetId: string) => performanceService.removeWidget(widgetId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: performanceKeys.dashboards(projectId) }),
  });
}
