import type { Aggregation, MockShape, Series, SeriesPoint, Span } from '../types/performance.types';

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

  static value(
    value: number | null | undefined,
    isDuration: boolean,
    aggregation: Aggregation,
  ): string {
    if (value === null || value === undefined) return '—';
    if (aggregation === 'RATE') return `${PerformanceUtils.number(value, 4)}/s`;
    if (isDuration && aggregation !== 'COUNT') return PerformanceUtils.duration(value);
    return PerformanceUtils.number(value, 2);
  }

  static number(value: number, maximumFractionDigits: number): string {
    return new Intl.NumberFormat('en', { maximumFractionDigits }).format(value);
  }

  static mockSeries(shape: MockShape, count = 24): number[] {
    return Array.from({ length: count }, (_, index) => {
      const progress = index / (count - 1);
      const wave = Math.sin(index * 0.7) * 0.25 + Math.sin(index * 1.9) * 0.1;
      const spike = index % 7 === 3 ? 0.9 : 0.1;
      const levels: Record<MockShape, number> = {
        wave: 0.55 + wave,
        steady: 0.5 + wave * 0.3,
        spiky: spike + Math.abs(wave) * 0.3,
        rising: 0.2 + progress * 0.6 + wave * 0.2,
      };
      return Math.round(Math.max(levels[shape], 0.03) * 100);
    });
  }

  static toChartData(series: Series): {
    rows: Record<string, string | number | null>[];
    lines: { id: string; label: string }[];
  } {
    const sources: { id: string; label: string; points: SeriesPoint[] }[] = series.groups
      ? series.groups.map((group, index) => ({
          id: `g${index}`,
          label: group.key,
          points: group.points,
        }))
      : [{ id: 'value', label: 'Value', points: series.points }];
    const byTimestamp = new Map<string, Record<string, string | number | null>>();
    for (const source of sources) {
      for (const point of source.points) {
        const row = byTimestamp.get(point.timestamp) ?? { timestamp: point.timestamp };
        row[source.id] = point.value;
        byTimestamp.set(point.timestamp, row);
      }
    }
    const rows = [...byTimestamp.values()].sort((a, b) =>
      String(a.timestamp).localeCompare(String(b.timestamp)),
    );
    return { rows, lines: sources.map(({ id, label }) => ({ id, label })) };
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

  static layout(
    spans: Span[],
    totalMs: number,
  ): { span: Span; left: number; width: number; depth: number }[] {
    const total = Math.max(
      totalMs,
      ...spans.map((span) => span.startOffsetMs + span.durationMs),
      1,
    );
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
