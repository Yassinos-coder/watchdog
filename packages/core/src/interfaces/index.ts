export type Level = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

export interface Frame {
  filename?: string;
  function?: string;
  lineno?: number;
  colno?: number;
  inApp?: boolean;
  contextLine?: string;
  preContext?: string[];
  postContext?: string[];
}

export interface ExceptionData {
  type: string;
  value: string;
  handled: boolean;
  stacktrace: { frames: Frame[] };
}

export interface Breadcrumb {
  timestamp?: number;
  category?: string;
  type?: string;
  level?: Level;
  message?: string;
  data?: Record<string, unknown>;
}

export interface UserContext {
  id?: string;
  email?: string;
  username?: string;
  [key: string]: unknown;
}

export interface RequestContext {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
}

export interface WatchdogEvent {
  eventId: string;
  timestamp: number;
  level: Level;
  platform: string;
  release?: string;
  environment?: string;
  message?: string;
  exception?: ExceptionData;
  fingerprint?: string[];
  breadcrumbs: Breadcrumb[];
  user?: UserContext;
  tags: Record<string, string>;
  extra: Record<string, unknown>;
  contexts: Record<string, unknown>;
  request?: RequestContext;
  sdk: { name: string; version: string };
}

export interface Transport {
  send(event: WatchdogEvent): void;
  flush(timeoutMs?: number): Promise<boolean>;
}

export interface WatchdogOptions {
  dsn: string;
  release?: string;
  environment?: string;
  platform?: string;
  enabled?: boolean;
  sampleRate?: number;
  maxBreadcrumbs?: number;
  maxEventsPerMinute?: number;
  ignoreErrors?: (string | RegExp)[];
  tags?: Record<string, string>;
  beforeSend?: (event: WatchdogEvent) => WatchdogEvent | null;
  transport?: Transport;
  fetch?: typeof fetch;
  debug?: boolean;
}

export interface CaptureContext {
  level?: Level;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  user?: UserContext;
  fingerprint?: string[];
  request?: RequestContext;
  handled?: boolean;
  contexts?: Record<string, unknown>;
}

export interface ParsedDsn {
  publicKey: string;
  projectId: string;
  origin: string;
  endpoint: string;
}

export interface SdkInfo {
  name: string;
  version: string;
}
