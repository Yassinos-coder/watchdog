import { describe, expect, it } from 'vitest';
import { SeriesUtils } from './series.utils';

const NOW = Date.UTC(2026, 10, 3, 16, 25);

describe('SeriesUtils.fill', () => {
  it('returns one bucket per hour for 24h, oldest first, with zeros for gaps', () => {
    const filled = SeriesUtils.fill([{ bucket: '2026-11-03T14:00:00.000Z', count: 7 }], '24h', NOW);

    expect(filled).toHaveLength(24);
    expect(filled.at(-1)?.bucket).toBe('2026-11-03T16:00:00.000Z');
    expect(filled[0].bucket).toBe('2026-11-02T17:00:00.000Z');
    expect(filled.find((point) => point.bucket === '2026-11-03T14:00:00.000Z')?.count).toBe(7);
    expect(filled.filter((point) => point.count === 0)).toHaveLength(23);
  });

  it('returns daily buckets for 7d and 30d', () => {
    expect(SeriesUtils.fill([], '7d', NOW)).toHaveLength(7);
    expect(SeriesUtils.fill([], '30d', NOW)).toHaveLength(30);
    expect(SeriesUtils.fill([], '7d', NOW).at(-1)?.bucket).toBe('2026-11-03T00:00:00.000Z');
  });
});
