import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsService } from '../services/projectsService';
import type { CreateProjectInput } from '../types/project.types';
import { projectKeys } from './useProjectQueries';

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProjectInput) => projectsService.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.all }),
  });
}

export function useUpdateProject(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<CreateProjectInput>) => projectsService.update(projectId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.all }),
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => projectsService.remove(projectId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.all }),
  });
}

export function useRotateUploadToken(projectId: string) {
  return useMutation({ mutationFn: () => projectsService.rotateUploadToken(projectId) });
}

export function useAddKey(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (label: string) => projectsService.addKey(projectId, label),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.all }),
  });
}

export function useSetKeyActive(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { keyId: string; active: boolean }) =>
      projectsService.setKeyActive(projectId, input.keyId, input.active),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.all }),
  });
}

export function useRemoveKey(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (keyId: string) => projectsService.removeKey(projectId, keyId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.all }),
  });
}
