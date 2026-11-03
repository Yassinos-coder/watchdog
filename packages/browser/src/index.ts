export {
  addBreadcrumb,
  captureException,
  captureMessage,
  close,
  flush,
  getClient,
  init,
  setContext,
  setExtra,
  setTag,
  setUser,
} from './browser-sdk';
export type { BrowserIntegrations, BrowserOptions } from './interfaces';
export type { Breadcrumb, CaptureContext, Level, UserContext, WatchdogEvent } from '@watchdog/core';
