import { RANGES } from '../constants/performance.constants';
import type { RangeKey } from '../interfaces/performance.interfaces';

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
}
