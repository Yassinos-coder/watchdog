import { describe, expect, it } from 'vitest';
import { ShieldOptionsFactory } from './shield-options.factory';

describe('ShieldOptionsFactory', () => {
  it('adds no whitelist when the variable is empty or missing', () => {
    expect(ShieldOptionsFactory.fromEnvironment({})).toEqual({});
    expect(ShieldOptionsFactory.fromEnvironment({ SHIELD_WHITELIST: ' , ' })).toEqual({});
  });

  it('splits addresses and ranges', () => {
    expect(
      ShieldOptionsFactory.fromEnvironment({ SHIELD_WHITELIST: '203.0.113.7, 198.51.100.0/24,2001:db8::1' }),
    ).toEqual({
      whitelist: { ips: ['203.0.113.7', '2001:db8::1'], cidrs: ['198.51.100.0/24'] },
    });
  });
});
