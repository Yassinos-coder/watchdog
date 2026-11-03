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
  navigationBreadcrumbs,
  setContext,
  setExtra,
  setTag,
  setUser,
  startTransaction,
} from './native-sdk';
export { WatchdogErrorBoundary } from './error-boundary';
export type {
  FallbackProps,
  FallbackRender,
  NativeIntegrations,
  NativeOptions,
  NavigationRefLike,
  WatchdogErrorBoundaryProps,
} from './interfaces';
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
