import type { IssueStatus } from '../../generated/prisma/enums';

export type IssueSort = 'lastSeen' | 'firstSeen' | 'events';
export type StatsRange = '24h' | '7d' | '30d';

export interface IssueView {
  id: string;
  projectId: string;
  title: string;
  culprit: string | null;
  level: string;
  platform: string | null;
  status: IssueStatus;
  firstSeen: Date;
  lastSeen: Date;
  eventCount: number;
  firstRelease: string | null;
  lastRelease: string | null;
  regressedAt: Date | null;
}

export interface EventView {
  id: string;
  eventId: string;
  issueId: string;
  timestamp: Date;
  level: string;
  message: string;
  release: string | null;
  environment: string | null;
  platform: string | null;
  payload: unknown;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface IssueDetailView {
  issue: IssueView;
  latestEvent: EventView | null;
}

export interface IssueListFilter {
  projectId: string;
  status?: IssueStatus;
  query?: string;
  sort: IssueSort;
  page: number;
  pageSize: number;
}

export interface StatsBucket {
  bucket: string;
  count: number;
}

export interface ProjectStatsView {
  range: StatsRange;
  totalEvents: number;
  unresolvedIssues: number;
  newIssues: number;
  series: StatsBucket[];
  topReleases: { release: string; count: number }[];
  topEnvironments: { environment: string; count: number }[];
}
