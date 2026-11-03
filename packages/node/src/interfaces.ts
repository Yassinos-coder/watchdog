import type { RequestContext, WatchdogOptions } from '@watchdog-sdk/core';

export interface NodeOptions extends WatchdogOptions {
  captureUncaughtExceptions?: boolean;
  captureUnhandledRejections?: boolean;
  onUnhandledRejection?: 'warn' | 'exit';
  contextLines?: boolean;
  flushTimeoutMs?: number;
}

export interface HttpRequestLike {
  originalUrl?: string;
  url?: string;
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
}

export interface HttpErrorContext {
  request?: RequestContext;
}

export type Uninstall = () => void;
