export * from '@watchdog/browser';
export { WatchdogErrorBoundary } from './error-boundary';
export { reactRootErrorHandlers, useWatchdog, withErrorBoundary } from './hooks';
export type {
  FallbackProps,
  FallbackRender,
  WatchdogErrorBoundaryProps,
} from './interfaces';
