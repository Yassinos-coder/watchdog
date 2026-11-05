import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { AppHostValidator } from './app-host.validator';

describe('AppHostValidator', () => {
  it('finds no mismatch when the hosts agree', () => {
    expect(
      AppHostValidator.findMismatch('https://watchdog.example.com', 'https://watchdog.example.com'),
    ).toBeNull();
  });

  it('ignores case, port and protocol differences', () => {
    expect(AppHostValidator.findMismatch('http://Example.com:3000', 'https://example.com')).toBeNull();
  });

  it('reports the host the instance is open on and the one it is configured for', () => {
    expect(
      AppHostValidator.findMismatch('https://watchdog.example.com', 'https://old.up.railway.app'),
    ).toEqual({
      host: 'watchdog.example.com',
      configuredUrl: 'https://old.up.railway.app',
      expectedUrl: 'https://watchdog.example.com',
    });
  });

  it('does not report anything it cannot parse', () => {
    expect(AppHostValidator.findMismatch('not a url', 'https://example.com')).toBeNull();
    expect(AppHostValidator.findMismatch('https://example.com', '')).toBeNull();
  });

  it('rejects passkey requests on another host and names both values and the fix', () => {
    const attempt = () =>
      AppHostValidator.assertMatches('https://watchdog.example.com', 'https://old.up.railway.app');
    expect(attempt).toThrow(BadRequestException);
    expect(attempt).toThrow(
      /old\.up\.railway\.app.*watchdog\.example\.com.*Set APP_URL to https:\/\/watchdog\.example\.com/,
    );
  });

  it('allows passkey requests on the configured host', () => {
    expect(() => AppHostValidator.assertMatches('https://example.com', 'https://example.com')).not.toThrow();
  });
});
