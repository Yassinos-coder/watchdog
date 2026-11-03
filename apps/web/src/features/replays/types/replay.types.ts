export interface Replay {
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
  items: Replay[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ReplayEvents {
  replay: Replay;
  events: unknown[];
}
