import { describe, expect, it } from 'vitest';
import { PerformanceUtils } from './performance.utils';

describe('PerformanceUtils.duration', () => {
  it('picks a readable unit', () => {
    expect(PerformanceUtils.duration(0.5)).toBe('0.50 ms');
    expect(PerformanceUtils.duration(12.34)).toBe('12.3 ms');
    expect(PerformanceUtils.duration(250)).toBe('250 ms');
    expect(PerformanceUtils.duration(1500)).toBe('1.50 s');
    expect(PerformanceUtils.duration(90_000)).toBe('1.5 min');
    expect(PerformanceUtils.duration(null)).toBe('—');
  });
});

describe('PerformanceUtils.layout', () => {
  const spans = [
    { spanId: 'b', parentSpanId: 'a', op: 'db', startOffsetMs: 20, durationMs: 30, status: 'ok' },
    { spanId: 'a', op: 'http', startOffsetMs: 0, durationMs: 100, status: 'ok' },
  ];

  it('orders by start time and positions against the total', () => {
    const rows = PerformanceUtils.layout(spans, 100);

    expect(rows.map((row) => row.span.spanId)).toEqual(['a', 'b']);
    expect(rows[1]).toMatchObject({ left: 20, width: 30, depth: 1 });
  });

  it('never lets a span overflow the total', () => {
    const rows = PerformanceUtils.layout([{ ...spans[0], startOffsetMs: 90, durationMs: 60 }], 100);

    expect(rows[0].left + rows[0].width).toBeLessThanOrEqual(100);
  });
});

describe('PerformanceUtils.percent', () => {
  it('shows more precision for tiny rates', () => {
    expect(PerformanceUtils.percent(0.5)).toBe('50.0%');
    expect(PerformanceUtils.percent(0.004)).toBe('0.40%');
  });
});
