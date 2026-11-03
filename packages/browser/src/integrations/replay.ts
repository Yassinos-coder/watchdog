import type { WatchdogClient } from '@watchdog-sdk/core';
import type { ReplayOptions, Uninstall } from '../interfaces';

const DEFAULT_FLUSH_INTERVAL_MS = 5_000;
const MAX_BUFFERED_EVENTS = 1_500;

interface RecordModule {
  record: (options: Record<string, unknown>) => (() => void) | undefined;
}

export function installReplay(client: WatchdogClient, options: ReplayOptions): Uninstall {
  const replayId = crypto.randomUUID();
  let sequence = 0;
  let buffer: unknown[] = [];
  let errorEventIds: string[] = [];
  let stopRecording: (() => void) | undefined;
  let stopped = false;

  const flush = (): void => {
    if (buffer.length === 0) return;
    client.sendReplay({
      replayId,
      sequence: sequence++,
      events: buffer,
      errorEventIds,
      url: location.href.split('#')[0],
      userAgent: navigator.userAgent,
    });
    buffer = [];
    errorEventIds = [];
  };

  const interval = setInterval(flush, options.flushIntervalMs ?? DEFAULT_FLUSH_INTERVAL_MS);
  const onHide = (): void => {
    if (document.visibilityState === 'hidden') flush();
  };
  document.addEventListener('visibilitychange', onHide);
  const stopListening = client.onCapture((eventId) => {
    errorEventIds.push(eventId);
  });

  void (import('@rrweb/record' as string) as Promise<RecordModule>)
    .then(({ record }) => {
      if (stopped) return;
      stopRecording = record({
        emit: (event: unknown) => {
          buffer.push(event);
          if (buffer.length >= MAX_BUFFERED_EVENTS) flush();
        },
        maskAllInputs: options.maskAllInputs !== false,
        maskTextSelector: options.maskAllText ? '*' : undefined,
        blockClass: 'wd-block',
        maskTextClass: 'wd-mask',
      });
    })
    .catch(() => undefined);

  return () => {
    stopped = true;
    stopRecording?.();
    flush();
    clearInterval(interval);
    document.removeEventListener('visibilitychange', onHide);
    stopListening();
  };
}
