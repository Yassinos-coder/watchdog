export type MetricKind = 'counter' | 'gauge' | 'distribution';

export interface MetricOptions {
  type?: MetricKind;
  unit?: string;
  tags?: Record<string, string>;
}

export interface MetricData {
  name: string;
  type: MetricKind;
  value: number;
  unit?: string;
  tags?: Record<string, string>;
  release?: string;
  environment?: string;
  timestamp: number;
}

const MAX_BUFFER = 200;
const FLUSH_INTERVAL_MS = 5_000;

export class MetricsBuffer {
  private buffer: MetricData[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly deliver: (metrics: MetricData[]) => void) {}

  add(metric: MetricData): void {
    this.buffer.push(metric);
    if (this.buffer.length >= MAX_BUFFER) {
      this.flush();
      return;
    }
    this.schedule();
  }

  flush(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.buffer.length === 0) {
      return;
    }
    const batch = this.buffer;
    this.buffer = [];
    this.deliver(batch);
  }

  private schedule(): void {
    if (this.timer) {
      return;
    }
    this.timer = setTimeout(() => this.flush(), FLUSH_INTERVAL_MS);
    const handle = this.timer as { unref?: () => void };
    handle.unref?.();
  }
}
