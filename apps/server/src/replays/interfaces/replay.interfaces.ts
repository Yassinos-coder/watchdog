export interface ReplayChunkInput {
  replayId: string;
  sequence: number;
  events: unknown[];
  startedAt: Date;
  lastEventAt: Date;
  url?: string;
  userAgent?: string;
  release?: string;
  environment?: string;
  userId?: string;
  errorEventIds: string[];
}

export interface ReplayView {
  id: string;
  replayId: string;
  startedAt: string;
  durationMs: number;
  chunkCount: number;
  eventCount: number;
  url: string | null;
  userAgent: string | null;
  release: string | null;
  environment: string | null;
  userId: string | null;
  errorEventIds: string[];
}

export interface ReplayPage {
  items: ReplayView[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ReplayEventsView {
  replay: ReplayView;
  events: unknown[];
}
