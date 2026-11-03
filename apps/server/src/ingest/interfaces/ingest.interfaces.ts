export type EventLevel = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

export interface IngestFrame {
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

export interface IngestException {
  type: string;
  value: string;
  handled: boolean;
  frames: IngestFrame[];
}

export interface IngestBreadcrumb {
  timestamp: string;
  category?: string;
  type?: string;
  level?: string;
  message?: string;
  data?: Record<string, unknown>;
}

export interface IngestRequest {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
}

export interface IngestSdk {
  name: string;
  version: string;
}

export interface IngestEvent {
  eventId: string;
  timestamp: Date;
  level: EventLevel;
  platform: string;
  release?: string;
  environment?: string;
  message: string;
  exception?: IngestException;
  fingerprint?: string[];
  breadcrumbs: IngestBreadcrumb[];
  user?: Record<string, unknown>;
  tags: Record<string, string>;
  extra: Record<string, unknown>;
  request?: IngestRequest;
  contexts: Record<string, unknown>;
  sdk?: IngestSdk;
}

export interface IngestResult {
  eventId: string;
  issueId: string;
  isNewIssue: boolean;
  isRegression: boolean;
  duplicate: boolean;
}

export interface RecordEventInput {
  projectId: string;
  event: IngestEvent;
  fingerprint: string;
  title: string;
  culprit: string | null;
}
