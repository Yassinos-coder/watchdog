import { randomUUID } from 'node:crypto';
import { BadRequestException } from '@nestjs/common';
import {
  LEVELS,
  MAX_BREADCRUMBS,
  MAX_CONTEXT_LINE_LENGTH,
  MAX_CONTEXT_LINES,
  MAX_FILENAME_LENGTH,
  MAX_FRAMES,
  MAX_FUTURE_SKEW_MS,
  MAX_JSON_FIELD_BYTES,
  MAX_MESSAGE_LENGTH,
  MAX_TAG_LENGTH,
  MAX_TAGS,
} from '../constants/ingest.constants';
import {
  EventLevel,
  IngestBreadcrumb,
  IngestEvent,
  IngestException,
  IngestFrame,
  IngestRequest,
  IngestSdk,
} from '../interfaces/ingest.interfaces';

const EVENT_ID_PATTERN = /^[a-zA-Z0-9-]{8,64}$/;

type Json = Record<string, unknown>;

export class EventPayloadValidator {
  static parse(body: unknown): IngestEvent {
    if (!EventPayloadValidator.isRecord(body)) {
      throw new BadRequestException('Event body must be a JSON object');
    }
    const exception = EventPayloadValidator.parseException(body.exception);
    const rawMessage = EventPayloadValidator.text(body.message, MAX_MESSAGE_LENGTH);
    const message = exception ? `${exception.type}: ${exception.value}` : rawMessage;
    if (!message) {
      throw new BadRequestException('Event needs a message or an exception');
    }
    return {
      eventId: EventPayloadValidator.parseEventId(body.eventId),
      timestamp: EventPayloadValidator.parseTimestamp(body.timestamp),
      level: EventPayloadValidator.parseLevel(body.level, exception !== undefined),
      platform: EventPayloadValidator.text(body.platform, 40) ?? 'javascript',
      release: EventPayloadValidator.text(body.release, 200),
      environment: EventPayloadValidator.text(body.environment, 100),
      message: message.slice(0, MAX_MESSAGE_LENGTH),
      exception,
      fingerprint: EventPayloadValidator.parseFingerprint(body.fingerprint),
      breadcrumbs: EventPayloadValidator.parseBreadcrumbs(body.breadcrumbs),
      user: EventPayloadValidator.boundedRecord(body.user),
      tags: EventPayloadValidator.parseTags(body.tags),
      extra: EventPayloadValidator.boundedRecord(body.extra) ?? {},
      request: EventPayloadValidator.parseRequest(body.request),
      contexts: EventPayloadValidator.boundedRecord(body.contexts) ?? {},
      sdk: EventPayloadValidator.parseSdk(body.sdk),
    };
  }

  private static parseEventId(value: unknown): string {
    if (typeof value === 'string' && EVENT_ID_PATTERN.test(value)) {
      return value;
    }
    return randomUUID();
  }

  private static parseTimestamp(value: unknown): Date {
    const now = Date.now();
    const parsed = EventPayloadValidator.toMillis(value);
    if (parsed === null || parsed > now + MAX_FUTURE_SKEW_MS) {
      return new Date(now);
    }
    return new Date(parsed);
  }

  private static toMillis(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value < 1e11 ? value * 1000 : value;
    }
    if (typeof value === 'string') {
      const parsed = Date.parse(value);
      return Number.isNaN(parsed) ? null : parsed;
    }
    return null;
  }

  private static parseLevel(value: unknown, hasException: boolean): EventLevel {
    if (typeof value === 'string' && (LEVELS as readonly string[]).includes(value)) {
      return value as EventLevel;
    }
    return hasException ? 'error' : 'info';
  }

  private static parseException(value: unknown): IngestException | undefined {
    if (!EventPayloadValidator.isRecord(value)) {
      return undefined;
    }
    const type = EventPayloadValidator.text(value.type, 200) ?? 'Error';
    const rawValue = EventPayloadValidator.text(value.value, MAX_MESSAGE_LENGTH) ?? '';
    const stacktrace = EventPayloadValidator.isRecord(value.stacktrace) ? value.stacktrace : {};
    const rawFrames = Array.isArray(stacktrace.frames) ? stacktrace.frames : [];
    return {
      type,
      value: rawValue,
      handled: value.handled !== false,
      frames: rawFrames
        .slice(-MAX_FRAMES)
        .map((frame) => EventPayloadValidator.parseFrame(frame))
        .filter((frame): frame is IngestFrame => frame !== null),
    };
  }

  private static parseFrame(value: unknown): IngestFrame | null {
    if (!EventPayloadValidator.isRecord(value)) {
      return null;
    }
    return {
      filename: EventPayloadValidator.text(value.filename, MAX_FILENAME_LENGTH),
      function: EventPayloadValidator.text(value.function, 300),
      lineno: EventPayloadValidator.positiveInt(value.lineno),
      colno: EventPayloadValidator.positiveInt(value.colno),
      inApp: typeof value.inApp === 'boolean' ? value.inApp : undefined,
      contextLine: EventPayloadValidator.text(value.contextLine, MAX_CONTEXT_LINE_LENGTH),
      preContext: EventPayloadValidator.lines(value.preContext),
      postContext: EventPayloadValidator.lines(value.postContext),
    };
  }

  private static parseBreadcrumbs(value: unknown): IngestBreadcrumb[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .slice(-MAX_BREADCRUMBS)
      .filter(EventPayloadValidator.isRecord)
      .map((crumb) => ({
        timestamp: new Date(EventPayloadValidator.toMillis(crumb.timestamp) ?? Date.now()).toISOString(),
        category: EventPayloadValidator.text(crumb.category, 100),
        type: EventPayloadValidator.text(crumb.type, 50),
        level: EventPayloadValidator.text(crumb.level, 20),
        message: EventPayloadValidator.text(crumb.message, 1_000),
        data: EventPayloadValidator.boundedRecord(crumb.data),
      }));
  }

  private static parseTags(value: unknown): Record<string, string> {
    if (!EventPayloadValidator.isRecord(value)) {
      return {};
    }
    const tags: Record<string, string> = {};
    for (const [key, tagValue] of Object.entries(value).slice(0, MAX_TAGS)) {
      if (typeof tagValue === 'string' || typeof tagValue === 'number' || typeof tagValue === 'boolean') {
        tags[key.slice(0, 64)] = String(tagValue).slice(0, MAX_TAG_LENGTH);
      }
    }
    return tags;
  }

  private static parseFingerprint(value: unknown): string[] | undefined {
    if (!Array.isArray(value) || value.length === 0) {
      return undefined;
    }
    const parts = value.filter((part): part is string => typeof part === 'string').slice(0, 10);
    return parts.length > 0 ? parts : undefined;
  }

  private static parseRequest(value: unknown): IngestRequest | undefined {
    if (!EventPayloadValidator.isRecord(value)) {
      return undefined;
    }
    return {
      url: EventPayloadValidator.text(value.url, 2_000),
      method: EventPayloadValidator.text(value.method, 10),
      headers: EventPayloadValidator.parseTags(value.headers),
    };
  }

  private static parseSdk(value: unknown): IngestSdk | undefined {
    if (!EventPayloadValidator.isRecord(value)) {
      return undefined;
    }
    const name = EventPayloadValidator.text(value.name, 60);
    const version = EventPayloadValidator.text(value.version, 30);
    return name && version ? { name, version } : undefined;
  }

  private static boundedRecord(value: unknown): Json | undefined {
    if (!EventPayloadValidator.isRecord(value)) {
      return undefined;
    }
    return JSON.stringify(value).length <= MAX_JSON_FIELD_BYTES
      ? value
      : { _truncated: true };
  }

  private static lines(value: unknown): string[] | undefined {
    if (!Array.isArray(value)) {
      return undefined;
    }
    return value
      .filter((line): line is string => typeof line === 'string')
      .slice(0, MAX_CONTEXT_LINES)
      .map((line) => line.slice(0, MAX_CONTEXT_LINE_LENGTH));
  }

  private static positiveInt(value: unknown): number | undefined {
    return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : undefined;
  }

  private static text(value: unknown, max: number): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed.slice(0, max) : undefined;
  }

  private static isRecord(value: unknown): value is Json {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
