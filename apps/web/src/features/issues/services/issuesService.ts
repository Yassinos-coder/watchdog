import { BaseApiClient } from '@/services/BaseApiClient';
import type {
  Issue,
  IssueDetail,
  IssueEvent,
  IssueListParams,
  IssueStatus,
  Page,
  ProjectStats,
  StatsRange,
} from '../types/issue.types';

const PAGE_SIZE = 25;

class IssuesService extends BaseApiClient {
  list(projectId: string, params: IssueListParams): Promise<Page<Issue>> {
    const query = new URLSearchParams({
      sort: params.sort,
      page: String(params.page),
      pageSize: String(PAGE_SIZE),
    });
    if (params.status) query.set('status', params.status);
    if (params.q) query.set('q', params.q);
    return this.get(`/projects/${projectId}/issues?${query.toString()}`);
  }

  getDetail(issueId: string): Promise<IssueDetail> {
    return this.get(`/issues/${issueId}`);
  }

  listEvents(issueId: string, page: number): Promise<Page<IssueEvent>> {
    return this.get(`/issues/${issueId}/events?page=${page}&pageSize=${PAGE_SIZE}`);
  }

  getEvent(eventId: string): Promise<IssueEvent> {
    return this.get(`/events/${eventId}`);
  }

  getStats(projectId: string, range: StatsRange): Promise<ProjectStats> {
    return this.get(`/projects/${projectId}/stats?range=${range}`);
  }

  updateStatus(issueId: string, status: IssueStatus): Promise<Issue> {
    return this.patch(`/issues/${issueId}`, { status });
  }

  remove(issueId: string): Promise<void> {
    return this.delete(`/issues/${issueId}`);
  }
}

export const issuesService = new IssuesService();
export const ISSUES_PAGE_SIZE = PAGE_SIZE;
