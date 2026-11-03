import { describe, expect, it } from 'vitest';
import { VersionUtils } from './version.utils';

describe('VersionUtils.isNewer', () => {
  it('compares each part numerically', () => {
    expect(VersionUtils.isNewer('0.5.0', '0.4.4')).toBe(true);
    expect(VersionUtils.isNewer('0.4.10', '0.4.9')).toBe(true);
    expect(VersionUtils.isNewer('1.0.0', '0.99.99')).toBe(true);
  });

  it('is false for equal or older versions', () => {
    expect(VersionUtils.isNewer('0.4.4', '0.4.4')).toBe(false);
    expect(VersionUtils.isNewer('0.4.3', '0.4.4')).toBe(false);
  });

  it('ignores anything that is not a plain x.y.z version', () => {
    expect(VersionUtils.isNewer('1.0.0-beta.1', '0.4.4')).toBe(false);
    expect(VersionUtils.isNewer('0.5.0', 'unknown')).toBe(false);
    expect(VersionUtils.isNewer('', '0.4.4')).toBe(false);
  });
});
