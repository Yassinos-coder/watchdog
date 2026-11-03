import type { CaptureContext } from '@watchdog/core';
import { Uninstall } from '../interfaces';

type Capture = (error: unknown, context?: CaptureContext) => void;

export function installGlobalHandlers(capture: Capture): Uninstall {
  const onError = (event: ErrorEvent): void => {
    if (event.error) {
      capture(event.error, { handled: false, tags: { mechanism: 'window.onerror' } });
      return;
    }
    if (event.message) {
      const location = event.filename ? `${event.filename}:${event.lineno}:${event.colno}` : undefined;
      capture(event.message, {
        handled: false,
        tags: { mechanism: 'window.onerror' },
        extra: location ? { location } : undefined,
      });
    }
  };

  const onRejection = (event: PromiseRejectionEvent): void => {
    capture(event.reason, { handled: false, tags: { mechanism: 'unhandledrejection' } });
  };

  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onRejection);

  return () => {
    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onRejection);
  };
}
