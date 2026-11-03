export {
  addBreadcrumb,
  captureException,
  captureMessage,
  captureRequestError,
  close,
  flush,
  getClient,
  init,
  setContext,
  setExtra,
  setTag,
  setUser,
} from './node-sdk';
export { expressErrorHandler } from './express';
export { ExceptionPolicy } from './exception-policy';
export type { HttpRequestLike, NodeOptions } from './interfaces';
export type { Breadcrumb, CaptureContext, Level, UserContext, WatchdogEvent } from '@watchdog/core';
