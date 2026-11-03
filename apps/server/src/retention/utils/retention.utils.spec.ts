import { describe, expect, it } from 'vitest';
import { RetentionUtils } from './retention.utils';

describe('RetentionUtils.cutoff', () => {
  it('subtracts whole days from now', () => {
    expect(RetentionUtils.cutoff(2, 10 * 86_400_000)?.getTime()).toBe(8 * 86_400_000);
  });

  it('treats zero, negative and invalid values as keep forever', () => {
    expect(RetentionUtils.cutoff(0)).toBeNull();
    expect(RetentionUtils.cutoff(-5)).toBeNull();
    expect(RetentionUtils.cutoff(Number.NaN)).toBeNull();
  });
});
