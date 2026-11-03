import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { OAuthValidator } from './oauth.validator';

describe('OAuthValidator', () => {
  it('accepts only known providers', () => {
    expect(OAuthValidator.parseProvider('github')).toBe('github');
    expect(() => OAuthValidator.parseProvider('myspace')).toThrow(BadRequestException);
    expect(() => OAuthValidator.parseProvider('constructor')).toThrow(BadRequestException);
  });

  it('requires the callback state to match the cookie', () => {
    expect(OAuthValidator.isStateValid('abc', 'abc')).toBe(true);
    expect(OAuthValidator.isStateValid('abc', 'abd')).toBe(false);
    expect(OAuthValidator.isStateValid('abc', undefined)).toBe(false);
    expect(OAuthValidator.isStateValid('', '')).toBe(false);
  });
});
