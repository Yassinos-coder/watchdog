import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthSession } from '@/features/auth/hooks/useAuthQueries';
import { performanceService } from '../services/performanceService';
import type { Dashboard, WidgetInput, WidgetLayoutItem } from '../types/performance.types';
import { DashboardCache } from '../utils/dashboardCache';
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

export function useSaveLayout(projectId: string) {
  const queryClient = useQueryClient();
  const { data: session } = useAuthSession();
  return useMutation({
    mutationFn: (input: { dashboardId: string; items: WidgetLayoutItem[] }) =>
      performanceService.saveLayout(input.dashboardId, input.items),
    onSuccess: (_, input) => {
      const next = queryClient
        .getQueryData<Dashboard[]>(performanceKeys.dashboards(projectId))
        ?.map((dashboard) =>
          dashboard.id === input.dashboardId
            ? {
                ...dashboard,
                widgets: dashboard.widgets.map((widget) => {
                  const item = input.items.find((entry) => entry.id === widget.id);
                  return item
                    ? { ...widget, layout: { x: item.x, y: item.y, w: item.w, h: item.h } }
                    : widget;
                }),
              }
            : dashboard,
        );
      if (!next) return;
      queryClient.setQueryData(performanceKeys.dashboards(projectId), next);
      DashboardCache.write(session?.user?.id, projectId, next);
    },
  });
}
