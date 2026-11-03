import { useMutation, useQueryClient } from '@tanstack/react-query';
import { issuesService } from '../services/issuesService';
import type { IssueStatus } from '../types/issue.types';

export function useUpdateIssueStatus(issueId: string, projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: IssueStatus) => issuesService.updateStatus(issueId, status),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['issue', issueId] }),
        queryClient.invalidateQueries({ queryKey: ['issues', projectId] }),
        queryClient.invalidateQueries({ queryKey: ['stats', projectId] }),
      ]);
    },
  });
}

export function useDeleteIssue(issueId: string, projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => issuesService.remove(issueId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['issues', projectId] });
      await queryClient.invalidateQueries({ queryKey: ['stats', projectId] });
    },
  });
}
