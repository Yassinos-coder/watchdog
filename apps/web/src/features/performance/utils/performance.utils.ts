import type { Aggregation, Span } from '../types/performance.types';

const SECOND_MS = 1_000;
const MINUTE_MS = 60 * SECOND_MS;

export class PerformanceUtils {
  static duration(ms: number | null | undefined): string {
    if (ms === null || ms === undefined) return '—';
    if (ms < 1) return `${ms.toFixed(2)} ms`;
    if (ms < 100) return `${ms.toFixed(1)} ms`;
    if (ms < SECOND_MS) return `${Math.round(ms)} ms`;
    if (ms < MINUTE_MS) return `${(ms / SECOND_MS).toFixed(2)} s`;
    return `${(ms / MINUTE_MS).toFixed(1)} min`;
  }

  static percent(rate: number): string {
    return `${(rate * 100).toFixed(rate > 0 && rate < 0.01 ? 2 : 1)}%`;
  }

  static value(value: number | null | undefined, isDuration: boolean, aggregation: Aggregation): string {
    if (value === null || value === undefined) return '—';
    if (isDuration && aggregation !== 'COUNT') return PerformanceUtils.duration(value);
    return new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(value);
  }

  static depth(span: Span, spans: Span[]): number {
    const byId = new Map(spans.map((item) => [item.spanId, item]));
    let depth = 0;
    let current = span.parentSpanId ? byId.get(span.parentSpanId) : undefined;
    while (current && depth < 20) {
      depth += 1;
      current = current.parentSpanId ? byId.get(current.parentSpanId) : undefined;
    }
    return depth;
  }

  static layout(spans: Span[], totalMs: number): { span: Span; left: number; width: number; depth: number }[] {
    const total = Math.max(totalMs, ...spans.map((span) => span.startOffsetMs + span.durationMs), 1);
    return [...spans]
      .sort((a, b) => a.startOffsetMs - b.startOffsetMs)
      .map((span) => ({
        span,
        left: (span.startOffsetMs / total) * 100,
        width: Math.max((span.durationMs / total) * 100, 0.4),
        depth: PerformanceUtils.depth(span, spans),
      }));
  }
}
