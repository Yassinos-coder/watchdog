import { describe, expect, it } from 'vitest';
import { ReplayUtils } from './replay.utils';

describe('ReplayUtils', () => {
  it('formats durations as m:ss', () => {
    expect(ReplayUtils.duration(0)).toBe('0:00');
    expect(ReplayUtils.duration(65_400)).toBe('1:05');
  });

  it('reduces urls to a path and survives garbage', () => {
    expect(ReplayUtils.path('https://shop.test/cart?x=1')).toBe('/cart?x=1');
    expect(ReplayUtils.path(null)).toBe('Unknown page');
    expect(ReplayUtils.path('not a url')).toBe('not a url');
  });
});
