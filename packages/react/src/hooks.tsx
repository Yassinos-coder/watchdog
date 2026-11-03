import {
  addBreadcrumb,
  captureException,
  captureMessage,
  setContext,
  setTag,
  setUser,
} from '@watchdog-sdk/browser';
import type { ComponentType } from 'react';
import { WatchdogErrorBoundary } from './error-boundary';
import type {
  ReactRootErrorInfo,
  WatchdogErrorBoundaryProps,
} from './interfaces';

const WATCHDOG_API = {
  addBreadcrumb,
  captureException,
  captureMessage,
  setContext,
  setTag,
  setUser,
};

export function useWatchdog(): typeof WATCHDOG_API {
  return WATCHDOG_API;
}

export function withErrorBoundary<Props extends object>(
  Wrapped: ComponentType<Props>,
  boundaryProps: Omit<WatchdogErrorBoundaryProps, 'children'>,
): ComponentType<Props> {
  const WithBoundary = (props: Props) => (
    <WatchdogErrorBoundary {...boundaryProps}>
      <Wrapped {...props} />
    </WatchdogErrorBoundary>
  );
  WithBoundary.displayName = `withErrorBoundary(${Wrapped.displayName ?? Wrapped.name ?? 'Component'})`;
  return WithBoundary;
}

export function reactRootErrorHandlers() {
  return {
    onUncaughtError: (error: unknown, info: ReactRootErrorInfo) => {
      captureException(error, {
        handled: false,
        tags: { mechanism: 'react.uncaught' },
        extra: { componentStack: info.componentStack ?? '' },
      });
    },
    onCaughtError: (error: unknown, info: ReactRootErrorInfo) => {
      captureException(error, {
        handled: true,
        tags: { mechanism: 'react.caught' },
        extra: { componentStack: info.componentStack ?? '' },
      });
    },
    onRecoverableError: (error: unknown, info: ReactRootErrorInfo) => {
      captureException(error, {
        handled: true,
        level: 'warning',
        tags: { mechanism: 'react.recoverable' },
        extra: { componentStack: info.componentStack ?? '' },
      });
    },
  };
}
