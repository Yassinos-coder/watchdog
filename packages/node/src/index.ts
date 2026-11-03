export {
  addBreadcrumb,
  captureException,
  captureMessage,
  captureRequestError,
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
} from './node-sdk';
export { expressErrorHandler } from './express';
export { expressTracing } from './tracing';
export { ExceptionPolicy } from './exception-policy';
export type { HttpRequestLike, NodeOptions } from './interfaces';
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
