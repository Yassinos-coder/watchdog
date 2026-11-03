import { describe, expect, it } from 'vitest';
import { RangeUtils } from './range.utils';

describe('RangeUtils', () => {
  it('subtracts the range from now', () => {
    expect(RangeUtils.from('1h', 10_000_000).getTime()).toBe(10_000_000 - 3_600_000);
  });

  it('reports bucket sizes in milliseconds', () => {
    expect(RangeUtils.bucketMs('1h')).toBe(60_000);
    expect(RangeUtils.bucketMs('24h')).toBe(3_600_000);
    expect(RangeUtils.bucketMs('7d')).toBe(6 * 3_600_000);
    expect(RangeUtils.bucketMs('30d')).toBe(86_400_000);
  });
});
