import type { StatsRange } from '../types/issue.types';

export interface SeriesPoint {
  bucket: string;
  count: number;
}

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const BUCKETS: Record<StatsRange, { count: number; step: number }> = {
  '24h': { count: 24, step: HOUR_MS },
  '7d': { count: 7, step: DAY_MS },
  '30d': { count: 30, step: DAY_MS },
};

export class SeriesUtils {
  static fill(series: SeriesPoint[], range: StatsRange, now = Date.now()): SeriesPoint[] {
    const { count, step } = BUCKETS[range];
    const currentBucket = Math.floor(now / step) * step;
    const known = new Map(series.map((point) => [new Date(point.bucket).getTime(), point.count]));
    return Array.from({ length: count }, (_, index) => {
      const time = currentBucket - (count - 1 - index) * step;
      return { bucket: new Date(time).toISOString(), count: known.get(time) ?? 0 };
    });
  }
}
