import { MINUTE_MS, SPIKE_COUNTER_LIMIT } from '../constants/alert.constants';

interface Counter {
  count: number;
  windowStart: number;
}

export class SpikeDetector {
  private readonly counters = new Map<string, Counter>();

  record(key: string, threshold: number, windowMins: number, now = Date.now()): number | null {
    const windowMs = windowMins * MINUTE_MS;
    const current = this.counters.get(key);
    const counter = !current || now - current.windowStart >= windowMs ? { count: 0, windowStart: now } : current;
    counter.count += 1;

    if (counter.count >= threshold) {
      this.counters.delete(key);
      return counter.count;
    }
    this.remember(key, counter);
    return null;
  }

  size(): number {
    return this.counters.size;
  }

  private remember(key: string, counter: Counter): void {
    if (!this.counters.has(key) && this.counters.size >= SPIKE_COUNTER_LIMIT) {
      const oldest = this.counters.keys().next().value;
      if (oldest !== undefined) {
        this.counters.delete(oldest);
      }
    }
    this.counters.set(key, counter);
  }
}
