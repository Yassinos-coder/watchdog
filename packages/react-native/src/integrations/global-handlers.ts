import type { CaptureContext } from '@watchdog-sdk/core';
import type { Uninstall } from '../interfaces';

type Capture = (error: unknown, context?: CaptureContext) => void;
type GlobalHandler = (error: unknown, isFatal?: boolean) => void;

interface ErrorUtilsLike {
  getGlobalHandler(): GlobalHandler;
  setGlobalHandler(handler: GlobalHandler): void;
}

interface HermesLike {
  hasPromise?: () => boolean;
  enablePromiseRejectionTracker?: (options: {
    allRejections: boolean;
    onUnhandled: (id: number, rejection: unknown) => void;
    onHandled?: (id: number) => void;
  }) => void;
}

export function installGlobalHandler(
  capture: Capture,
  flush: (timeoutMs: number) => Promise<boolean>,
  flushTimeoutMs: number,
): Uninstall {
  const errorUtils = (globalThis as { ErrorUtils?: ErrorUtilsLike }).ErrorUtils;
  if (!errorUtils) {
    return () => undefined;
  }

  const previous = errorUtils.getGlobalHandler();
  const handler: GlobalHandler = (error, isFatal) => {
    capture(error, {
      handled: false,
      level: isFatal ? 'fatal' : 'error',
      tags: { mechanism: 'ErrorUtils', fatal: String(Boolean(isFatal)) },
    });
    if (!isFatal) {
      previous(error, isFatal);
      return;
    }
    void flush(flushTimeoutMs).finally(() => previous(error, isFatal));
  };
  errorUtils.setGlobalHandler(handler);

  return () => {
    if (errorUtils.getGlobalHandler() === handler) {
      errorUtils.setGlobalHandler(previous);
    }
  };
}

export function installUnhandledRejections(capture: Capture): Uninstall {
  const hermes = (globalThis as { HermesInternal?: HermesLike }).HermesInternal;
  if (!hermes?.enablePromiseRejectionTracker || hermes.hasPromise?.() === false) {
    return () => undefined;
  }

  hermes.enablePromiseRejectionTracker({
    allRejections: true,
    onUnhandled: (_id, rejection) => {
      capture(rejection, { handled: false, tags: { mechanism: 'unhandledrejection' } });
    },
  });

  return () => {
    hermes.enablePromiseRejectionTracker?.({ allRejections: false, onUnhandled: () => undefined });
  };
}
