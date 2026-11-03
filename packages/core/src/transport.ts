import { ParsedDsn, Transport, WatchdogEvent } from './interfaces';

const MAX_QUEUE = 50;
const MAX_ATTEMPTS = 4;
const BASE_DELAY_MS = 1_000;
const MAX_DELAY_MS = 15_000;
const DEFAULT_FLUSH_TIMEOUT_MS = 2_000;

interface QueuedEvent {
  event: WatchdogEvent;
  attempts: number;
}

export class FetchTransport implements Transport {
  private readonly queue: QueuedEvent[] = [];
  private draining: Promise<void> | null = null;
  private blockedUntil = 0;

  constructor(
    private readonly dsn: ParsedDsn,
    private readonly fetchImpl: typeof fetch,
    private readonly onDebug: (message: string) => void,
  ) {}

  send(event: WatchdogEvent): void {
    if (this.queue.length >= MAX_QUEUE) {
      this.queue.shift();
      this.onDebug('queue full, dropping the oldest event');
    }
    this.queue.push({ event, attempts: 0 });
    void this.drain();
  }

  async flush(timeoutMs = DEFAULT_FLUSH_TIMEOUT_MS): Promise<boolean> {
    const deadline = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), timeoutMs));
    const finished = (async () => {
      while (this.queue.length > 0 || this.draining) {
        await (this.draining ?? this.drain());
        if (this.queue.length > 0 && Date.now() < this.blockedUntil) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }
      return true;
    })();
    return Promise.race([finished, deadline]);
  }

  private drain(): Promise<void> {
    if (!this.draining) {
      this.draining = this.run().finally(() => {
        this.draining = null;
      });
    }
    return this.draining;
  }

  private async run(): Promise<void> {
    while (this.queue.length > 0) {
      const wait = this.blockedUntil - Date.now();
      if (wait > 0) {
        await new Promise((resolve) => setTimeout(resolve, wait));
      }
      const item = this.queue[0];
      const outcome = await this.attempt(item.event);
      if (outcome === 'retry') {
        item.attempts += 1;
        if (item.attempts >= MAX_ATTEMPTS) {
          this.queue.shift();
          this.onDebug('giving up on an event after repeated failures');
          continue;
        }
        this.blockedUntil = Date.now() + Math.min(BASE_DELAY_MS * 2 ** item.attempts, MAX_DELAY_MS);
        continue;
      }
      this.queue.shift();
    }
  }

  private async attempt(event: WatchdogEvent): Promise<'done' | 'retry'> {
    try {
      const response = await this.fetchImpl(this.dsn.endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-watchdog-key': this.dsn.publicKey },
        body: JSON.stringify(event),
        keepalive: true,
      });
      if (response.ok) {
        return 'done';
      }
      if (response.status === 429 || response.status >= 500) {
        const retryAfter = Number(response.headers.get('retry-after'));
        this.blockedUntil = retryAfter > 0 ? Date.now() + retryAfter * 1_000 : this.blockedUntil;
        return 'retry';
      }
      this.onDebug(`server rejected an event with status ${response.status}`);
      return 'done';
    } catch (error) {
      this.onDebug(`network error: ${error instanceof Error ? error.message : String(error)}`);
      return 'retry';
    }
  }
}
