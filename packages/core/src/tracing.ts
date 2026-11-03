import { Uuid } from './utils/uuid';

export interface SpanData {
  spanId: string;
  parentSpanId?: string;
  op: string;
  description?: string;
  startOffsetMs: number;
  durationMs: number;
  status: string;
}

export interface TransactionData {
  eventId: string;
  traceId: string;
  name: string;
  op: string;
  status: string;
  timestamp: number;
  durationMs: number;
  release?: string;
  environment?: string;
  spans: SpanData[];
  tags: Record<string, string>;
  sdk: { name: string; version: string };
}

export interface TransactionOptions {
  name: string;
  op?: string;
  traceId?: string;
  tags?: Record<string, string>;
}

const MAX_SPANS = 200;

export class Span {
  private finished = false;
  readonly spanId = Uuid.create().replace(/-/g, '').slice(0, 16);

  constructor(
    private readonly transaction: Transaction,
    readonly op: string,
    readonly description: string | undefined,
    readonly parentSpanId: string | undefined,
    private readonly startedAt: number,
  ) {}

  startChild(op: string, description?: string): Span {
    return this.transaction.startSpan(op, description, this.spanId);
  }

  finish(status = 'ok'): void {
    if (this.finished) {
      return;
    }
    this.finished = true;
    this.transaction.record({
      spanId: this.spanId,
      parentSpanId: this.parentSpanId,
      op: this.op,
      description: this.description,
      startOffsetMs: this.startedAt - this.transaction.startedAt,
      durationMs: Date.now() - this.startedAt,
      status,
    });
  }
}

export class Transaction {
  readonly traceId: string;
  readonly startedAt = Date.now();
  private readonly spans: SpanData[] = [];
  private readonly tags: Record<string, string>;
  private finished = false;

  constructor(
    private readonly options: TransactionOptions,
    private readonly emit: (data: Omit<TransactionData, 'release' | 'environment' | 'sdk'>) => void,
  ) {
    this.traceId = options.traceId ?? Uuid.create();
    this.tags = { ...options.tags };
  }

  setTag(key: string, value: string): void {
    this.tags[key] = value;
  }

  startSpan(op: string, description?: string, parentSpanId?: string): Span {
    return new Span(this, op, description, parentSpanId, Date.now());
  }

  async trace<T>(op: string, description: string | undefined, work: () => Promise<T> | T): Promise<T> {
    const span = this.startSpan(op, description);
    try {
      const result = await work();
      span.finish('ok');
      return result;
    } catch (error) {
      span.finish('internal_error');
      throw error;
    }
  }

  record(span: SpanData): void {
    if (this.spans.length < MAX_SPANS) {
      this.spans.push(span);
    }
  }

  finish(status = 'ok', name?: string): void {
    if (this.finished) {
      return;
    }
    this.finished = true;
    this.emit({
      eventId: Uuid.create(),
      traceId: this.traceId,
      name: name ?? this.options.name,
      op: this.options.op ?? 'default',
      status,
      timestamp: this.startedAt,
      durationMs: Date.now() - this.startedAt,
      spans: this.spans,
      tags: this.tags,
    });
  }
}
