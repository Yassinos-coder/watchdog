export type IssueStatus = 'UNRESOLVED' | 'RESOLVED' | 'IGNORED';
export type IssueSort = 'lastSeen' | 'firstSeen' | 'events';
export type StatsRange = '24h' | '7d' | '30d';

export interface Issue {
  id: string;
  projectId: string;
  title: string;
  culprit: string | null;
  level: string;
  platform: string | null;
  status: IssueStatus;
  firstSeen: string;
  lastSeen: string;
  eventCount: number;
  firstRelease: string | null;
  lastRelease: string | null;
  regressedAt: string | null;
}

export interface StackFrame {
  filename?: string;
  function?: string;
  lineno?: number;
  colno?: number;
  inApp?: boolean;
  contextLine?: string;
  preContext?: string[];
  postContext?: string[];
  symbolicated?: boolean;
}

export interface ExceptionPayload {
  type: string;
  value: string;
  handled: boolean;
  frames: StackFrame[];
}

export interface Breadcrumb {
  timestamp: string;
  category?: string;
  type?: string;
  level?: string;
  message?: string;
  data?: Record<string, unknown>;
}

export interface EventPayload {
  exception?: ExceptionPayload;
  breadcrumbs?: Breadcrumb[];
  user?: Record<string, unknown>;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  request?: { url?: string; method?: string; headers?: Record<string, string> };
  contexts?: Record<string, unknown>;
  sdk?: { name: string; version: string };
}

export interface IssueEvent {
  id: string;
  eventId: string;
  issueId: string;
  timestamp: string;
  level: string;
  message: string;
  release: string | null;
  environment: string | null;
  platform: string | null;
  payload: EventPayload;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface IssueDetail {
  issue: Issue;
  latestEvent: IssueEvent | null;
}

export interface IssueListParams {
  status?: IssueStatus;
  q?: string;
  sort: IssueSort;
  page: number;
}

export interface ProjectStats {
  range: StatsRange;
  totalEvents: number;
  unresolvedIssues: number;
  newIssues: number;
  series: { bucket: string; count: number }[];
  topReleases: { release: string; count: number }[];
  topEnvironments: { environment: string; count: number }[];
}

export interface CodeLine {
  number: number;
  text: string;
  failing?: boolean;
}
