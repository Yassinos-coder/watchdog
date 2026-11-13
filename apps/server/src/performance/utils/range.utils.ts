import { RANGES, ROLLUP_RANGE_KEYS } from '../constants/performance.constants';
import type { RangeKey, SeriesSource } from '../interfaces/performance.interfaces';

export class RangeUtils {
  static from(range: RangeKey, now = Date.now()): Date {
    return new Date(now - RANGES[range].ms);
  }

  static bucket(range: RangeKey): string {
    return RANGES[range].bucket;
  }

  static bucketMs(range: RangeKey): number {
    return RANGES[range].bucketMs;
  }

  static windowSeconds(range: RangeKey): number {
    return RANGES[range].ms / 1000;
  }

  static usesRollups(range: RangeKey, source: SeriesSource): boolean {
    return source === 'METRIC' && (ROLLUP_RANGE_KEYS as readonly string[]).includes(range);
  }
}
