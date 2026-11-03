import {
  Breadcrumb,
  CaptureContext,
  ExceptionData,
  Level,
  ParsedDsn,
  SdkInfo,
  Transport,
  UserContext,
  WatchdogEvent,
  WatchdogOptions,
} from './interfaces';
import { Scope } from './scope';
import { FetchTransport } from './transport';
import { DsnParser } from './utils/dsn';
import { StackParser } from './utils/stack';
import { Uuid } from './utils/uuid';

const DEFAULT_MAX_BREADCRUMBS = 100;
const DEFAULT_MAX_EVENTS_PER_MINUTE = 60;
const DUPLICATE_WINDOW_MS = 2_000;
const MINUTE_MS = 60_000;
const MAX_CAUSE_DEPTH = 5;

export class WatchdogClient {
  readonly scope: Scope;
  private readonly dsn: ParsedDsn;
  private readonly transport: Transport;
  private readonly enabled: boolean;
  private recentSignature: { value: string; at: number } | null = null;
  private windowStart = Date.now();
  private windowCount = 0;

  constructor(
    private readonly options: WatchdogOptions,
    private readonly sdk: SdkInfo,
  ) {
    this.dsn = DsnParser.parse(options.dsn);
    this.enabled = options.enabled !== false;
    this.scope = new Scope(options.maxBreadcrumbs ?? DEFAULT_MAX_BREADCRUMBS);
    this.scope.tags = { ...options.tags };
    this.transport =
      options.transport ??
      new FetchTransport(this.dsn, options.fetch ?? globalThis.fetch.bind(globalThis), (message) =>
        this.debug(message),
      );
  }

  captureException(error: unknown, context: CaptureContext = {}): string | undefined {
    const exception = this.toException(error, context.handled ?? true);
    const extra = { ...context.extra, ...this.causeOf(error) };
    return this.capture(
      { exception, message: `${exception.type}: ${exception.value}` },
      { ...context, level: context.level ?? 'error', extra },
    );
  }

  captureMessage(message: string, level: Level = 'info', context: CaptureContext = {}): string | undefined {
    return this.capture({ message }, { ...context, level });
  }

  addBreadcrumb(breadcrumb: Breadcrumb): void {
    this.scope.addBreadcrumb(breadcrumb);
  }

  setUser(user: UserContext | undefined): void {
    this.scope.user = user;
  }

  setTag(key: string, value: string): void {
    this.scope.tags[key] = value;
  }

  setExtra(key: string, value: unknown): void {
    this.scope.extra[key] = value;
  }

  setContext(key: string, value: unknown): void {
    this.scope.contexts[key] = value;
  }

  flush(timeoutMs?: number): Promise<boolean> {
    return this.transport.flush(timeoutMs);
  }

  private capture(
    partial: Pick<WatchdogEvent, 'message' | 'exception'>,
    context: CaptureContext,
  ): string | undefined {
    if (!this.enabled || !this.shouldSample() || this.isIgnored(partial) || this.isDuplicate(partial)) {
      return undefined;
    }
    if (!this.withinRateLimit()) {
      this.debug('client-side rate limit reached, dropping the event');
      return undefined;
    }
    const built: WatchdogEvent = {
      eventId: Uuid.create(),
      timestamp: Date.now(),
      level: context.level ?? 'error',
      platform: this.options.platform ?? 'javascript',
      release: this.options.release,
      environment: this.options.environment,
      ...partial,
      fingerprint: context.fingerprint,
      breadcrumbs: this.scope.getBreadcrumbs(),
      user: context.user ?? this.scope.user,
      tags: { ...this.scope.tags, ...context.tags },
      extra: { ...this.scope.extra, ...context.extra },
      contexts: { ...this.scope.contexts, ...context.contexts },
      request: context.request,
      sdk: this.sdk,
    };
    const event = this.options.beforeSend ? this.options.beforeSend(built) : built;
    if (!event) {
      return undefined;
    }
    this.transport.send(event);
    return event.eventId;
  }

  private toException(error: unknown, handled: boolean): ExceptionData {
    if (error instanceof Error) {
      return {
        type: error.name || 'Error',
        value: error.message,
        handled,
        stacktrace: { frames: StackParser.parse(error.stack) },
      };
    }
    return {
      type: 'Error',
      value: typeof error === 'string' ? error : this.stringify(error),
      handled,
      stacktrace: { frames: [] },
    };
  }

  private causeOf(error: unknown): Record<string, unknown> {
    const causes: string[] = [];
    let current = error instanceof Error ? error.cause : undefined;
    while (current !== undefined && causes.length < MAX_CAUSE_DEPTH) {
      causes.push(current instanceof Error ? `${current.name}: ${current.message}` : this.stringify(current));
      current = current instanceof Error ? current.cause : undefined;
    }
    return causes.length > 0 ? { causes } : {};
  }

  private stringify(value: unknown): string {
    try {
      return JSON.stringify(value) ?? String(value);
    } catch {
      return String(value);
    }
  }

  private shouldSample(): boolean {
    const rate = this.options.sampleRate ?? 1;
    return rate >= 1 || Math.random() < rate;
  }

  private isIgnored(partial: Pick<WatchdogEvent, 'message' | 'exception'>): boolean {
    const texts = [partial.message, partial.exception?.value].filter(
      (text): text is string => typeof text === 'string' && text.length > 0,
    );
    return (this.options.ignoreErrors ?? []).some((pattern) =>
      texts.some((text) => (typeof pattern === 'string' ? text.includes(pattern) : pattern.test(text))),
    );
  }

  private isDuplicate(partial: Pick<WatchdogEvent, 'message' | 'exception'>): boolean {
    const frames = partial.exception?.stacktrace.frames ?? [];
    const top = frames.at(-1);
    const value = `${partial.message}|${top?.filename}:${top?.lineno}:${top?.colno}`;
    const now = Date.now();
    const duplicate =
      this.recentSignature !== null &&
      this.recentSignature.value === value &&
      now - this.recentSignature.at < DUPLICATE_WINDOW_MS;
    this.recentSignature = { value, at: now };
    return duplicate;
  }

  private withinRateLimit(): boolean {
    const now = Date.now();
    if (now - this.windowStart >= MINUTE_MS) {
      this.windowStart = now;
      this.windowCount = 0;
    }
    this.windowCount += 1;
    return this.windowCount <= (this.options.maxEventsPerMinute ?? DEFAULT_MAX_EVENTS_PER_MINUTE);
  }

  private debug(message: string): void {
    if (this.options.debug) {
      console.warn(`[watchdog] ${message}`);
    }
  }
}
