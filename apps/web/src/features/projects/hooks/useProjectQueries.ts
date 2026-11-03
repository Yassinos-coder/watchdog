import { useQuery } from '@tanstack/react-query';
import { projectsService } from '../services/projectsService';

export const projectKeys = {
  all: ['projects'] as const,
  detail: (projectId: string) => ['projects', projectId] as const,
  releases: (projectId: string) => ['projects', projectId, 'releases'] as const,
};

export function useProjects() {
  return useQuery({ queryKey: projectKeys.all, queryFn: () => projectsService.list() });
}

export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: projectKeys.detail(projectId ?? ''),
    queryFn: () => projectsService.getById(projectId!),
    enabled: Boolean(projectId),
  });
}

export function useReleases(projectId: string) {
  return useQuery({
    queryKey: projectKeys.releases(projectId),
    queryFn: () => projectsService.listReleases(projectId),
  });
}
