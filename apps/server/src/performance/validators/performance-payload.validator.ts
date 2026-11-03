import { randomUUID } from 'node:crypto';
import { BadRequestException } from '@nestjs/common';
import type { MetricType } from '../../generated/prisma/enums';
import {
  MAX_FUTURE_SKEW_MS,
  MAX_METRIC_NAME_LENGTH,
  MAX_METRICS_PER_REQUEST,
  MAX_SPAN_NAME_LENGTH,
  MAX_SPANS,
  MAX_TAG_COUNT,
  MAX_TAG_LENGTH,
  MAX_TRANSACTION_NAME_LENGTH,
  METRIC_NAME_PATTERN,
  METRIC_TYPES,
  TRACE_ID_PATTERN,
} from '../constants/performance.constants';
import type { MetricInput, SpanInput, TransactionInput } from '../interfaces/performance.interfaces';

type Json = Record<string, unknown>;

export class PerformancePayloadValidator {
  static parseTransaction(body: unknown): TransactionInput {
    if (!PerformancePayloadValidator.isRecord(body)) {
      throw new BadRequestException('Transaction body must be a JSON object');
    }
    const name = PerformancePayloadValidator.text(body.name, MAX_TRANSACTION_NAME_LENGTH);
    if (!name) {
      throw new BadRequestException('Transaction needs a name');
    }
    const durationMs = PerformancePayloadValidator.duration(body.durationMs);
    if (durationMs === null) {
      throw new BadRequestException('Transaction needs a non-negative durationMs');
    }
    return {
      eventId: PerformancePayloadValidator.id(body.eventId),
      traceId: PerformancePayloadValidator.id(body.traceId),
      name,
      op: PerformancePayloadValidator.text(body.op, 60) ?? 'default',
      status: PerformancePayloadValidator.text(body.status, 40) ?? 'ok',
      timestamp: PerformancePayloadValidator.timestamp(body.timestamp),
      durationMs,
      release: PerformancePayloadValidator.text(body.release, 200),
      environment: PerformancePayloadValidator.text(body.environment, 100),
      spans: PerformancePayloadValidator.spans(body.spans),
      tags: PerformancePayloadValidator.tags(body.tags),
    };
  }

  static parseMetrics(body: unknown): MetricInput[] {
    if (!PerformancePayloadValidator.isRecord(body) || !Array.isArray(body.metrics)) {
      throw new BadRequestException('Body must be {"metrics": [...]}');
    }
    if (body.metrics.length > MAX_METRICS_PER_REQUEST) {
      throw new BadRequestException(`At most ${MAX_METRICS_PER_REQUEST} metrics per request`);
    }
    return body.metrics
      .map((entry: unknown) => PerformancePayloadValidator.metric(entry))
      .filter((entry: MetricInput | null): entry is MetricInput => entry !== null);
  }

  private static metric(entry: unknown): MetricInput | null {
    if (!PerformancePayloadValidator.isRecord(entry)) {
      return null;
    }
    const name = PerformancePayloadValidator.text(entry.name, MAX_METRIC_NAME_LENGTH);
    const value = typeof entry.value === 'number' && Number.isFinite(entry.value) ? entry.value : null;
    if (!name || !METRIC_NAME_PATTERN.test(name) || value === null) {
      return null;
    }
    return {
      name,
      type: PerformancePayloadValidator.metricType(entry.type),
      value,
      unit: PerformancePayloadValidator.text(entry.unit, 20),
      tags: PerformancePayloadValidator.tags(entry.tags),
      release: PerformancePayloadValidator.text(entry.release, 200),
      environment: PerformancePayloadValidator.text(entry.environment, 100),
      timestamp: PerformancePayloadValidator.timestamp(entry.timestamp),
    };
  }

  private static metricType(value: unknown): MetricType {
    const upper = typeof value === 'string' ? value.toUpperCase() : '';
    return (METRIC_TYPES as readonly string[]).includes(upper) ? (upper as MetricType) : 'GAUGE';
  }

  private static spans(value: unknown): SpanInput[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .slice(0, MAX_SPANS)
      .map((entry: unknown) => PerformancePayloadValidator.span(entry))
      .filter((entry: SpanInput | null): entry is SpanInput => entry !== null);
  }

  private static span(entry: unknown): SpanInput | null {
    if (!PerformancePayloadValidator.isRecord(entry)) {
      return null;
    }
    const durationMs = PerformancePayloadValidator.duration(entry.durationMs);
    const startOffsetMs = PerformancePayloadValidator.duration(entry.startOffsetMs);
    const op = PerformancePayloadValidator.text(entry.op, 60);
    if (durationMs === null || startOffsetMs === null || !op) {
      return null;
    }
    return {
      spanId: PerformancePayloadValidator.text(entry.spanId, 64) ?? randomUUID().slice(0, 16),
      parentSpanId: PerformancePayloadValidator.text(entry.parentSpanId, 64),
      op,
      description: PerformancePayloadValidator.text(entry.description, MAX_SPAN_NAME_LENGTH),
      startOffsetMs,
      durationMs,
      status: PerformancePayloadValidator.text(entry.status, 40) ?? 'ok',
    };
  }

  private static tags(value: unknown): Record<string, string> {
    if (!PerformancePayloadValidator.isRecord(value)) {
      return {};
    }
    const entries = Object.entries(value)
      .filter(([, tag]) => typeof tag === 'string' || typeof tag === 'number' || typeof tag === 'boolean')
      .slice(0, MAX_TAG_COUNT)
      .map(([key, tag]) => [key.slice(0, 64), String(tag).slice(0, MAX_TAG_LENGTH)] as const);
    return Object.fromEntries(entries);
  }

  private static id(value: unknown): string {
    return typeof value === 'string' && TRACE_ID_PATTERN.test(value) ? value : randomUUID();
  }

  private static duration(value: unknown): number | null {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      return null;
    }
    return value;
  }

  private static timestamp(value: unknown): Date {
    const now = Date.now();
    const parsed = PerformancePayloadValidator.toMillis(value);
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

  private static text(value: unknown, max: number): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }
    const trimmed = value.trim();
    return trimmed ? trimmed.slice(0, max) : undefined;
  }

  private static isRecord(value: unknown): value is Json {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
