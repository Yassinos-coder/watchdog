export {
  addBreadcrumb,
  captureException,
  captureMessage,
  close,
  distribution,
  flush,
  gauge,
  getClient,
  increment,
  init,
  setContext,
  setExtra,
  setTag,
  setUser,
  startTransaction,
} from './browser-sdk';
export type { BrowserIntegrations, BrowserOptions, ReplayOptions } from './interfaces';
export type {
  Breadcrumb,
  CaptureContext,
  Level,
  MetricOptions,
  Span,
  Transaction,
  TransactionOptions,
  UserContext,
  WatchdogEvent,
} from '@watchdog-sdk/core';
