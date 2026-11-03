import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { issuesService } from '../services/issuesService';
import type { IssueListParams, StatsRange } from '../types/issue.types';

export const issueKeys = {
  list: (projectId: string, params: IssueListParams) => ['issues', projectId, params] as const,
  lists: (projectId: string) => ['issues', projectId] as const,
  detail: (issueId: string) => ['issue', issueId] as const,
  events: (issueId: string, page: number) => ['issue', issueId, 'events', page] as const,
  event: (eventId: string) => ['event', eventId] as const,
  stats: (projectId: string, range: StatsRange) => ['stats', projectId, range] as const,
};

export function useIssues(projectId: string, params: IssueListParams) {
  return useQuery({
    queryKey: issueKeys.list(projectId, params),
    queryFn: () => issuesService.list(projectId, params),
    placeholderData: keepPreviousData,
  });
}

export function useIssue(issueId: string) {
  return useQuery({ queryKey: issueKeys.detail(issueId), queryFn: () => issuesService.getDetail(issueId) });
}

export function useIssueEvents(issueId: string, page: number) {
  return useQuery({
    queryKey: issueKeys.events(issueId, page),
    queryFn: () => issuesService.listEvents(issueId, page),
    placeholderData: keepPreviousData,
  });
}

export function useEvent(eventId: string | null) {
  return useQuery({
    queryKey: issueKeys.event(eventId ?? ''),
    queryFn: () => issuesService.getEvent(eventId!),
    enabled: Boolean(eventId),
  });
}

export function useProjectStats(projectId: string, range: StatsRange) {
  return useQuery({
    queryKey: issueKeys.stats(projectId, range),
    queryFn: () => issuesService.getStats(projectId, range),
    refetchInterval: 30_000,
  });
}
