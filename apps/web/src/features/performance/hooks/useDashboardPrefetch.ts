import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuthSession } from '@/features/auth/hooks/useAuthQueries';
import { useProjects } from '@/features/projects/hooks/useProjectQueries';
import { dashboardsQueryOptions } from './usePerformanceQueries';

const MAX_PREFETCHED_PROJECTS = 20;
const FRESH_MS = 30_000;

export function useDashboardPrefetch(): void {
  const queryClient = useQueryClient();
  const { data: session } = useAuthSession();
  const { data: projects } = useProjects();
  const userId = session?.user?.id;

  useEffect(() => {
    if (!userId || !projects) return;
    projects.slice(0, MAX_PREFETCHED_PROJECTS).forEach((project) => {
      void queryClient.prefetchQuery({ ...dashboardsQueryOptions(project.id, userId), staleTime: FRESH_MS });
    });
  }, [queryClient, userId, projects]);
}
