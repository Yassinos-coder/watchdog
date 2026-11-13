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
    expect(RangeUtils.bucketMs('90d')).toBe(86_400_000);
  });

  it('serves only long metric ranges from rollups', () => {
    expect(RangeUtils.usesRollups('24h', 'METRIC')).toBe(false);
    expect(RangeUtils.usesRollups('7d', 'METRIC')).toBe(true);
    expect(RangeUtils.usesRollups('90d', 'METRIC')).toBe(true);
    expect(RangeUtils.usesRollups('30d', 'TRANSACTIONS')).toBe(false);
  });

  it('converts a range to seconds', () => {
    expect(RangeUtils.windowSeconds('1h')).toBe(3600);
  });
});
