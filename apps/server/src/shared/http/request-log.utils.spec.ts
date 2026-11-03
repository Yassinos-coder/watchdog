import { describe, expect, it } from 'vitest';
import { RequestLogUtils } from './request-log.utils';

describe('RequestLogUtils.safeUrl', () => {
  it('keeps harmless urls and query strings', () => {
    expect(RequestLogUtils.safeUrl('/api/issues?status=UNRESOLVED&page=2')).toBe(
      '/api/issues?status=UNRESOLVED&page=2',
    );
  });

  it('redacts project keys and other secrets', () => {
    const safe = RequestLogUtils.safeUrl('/api/ingest/v1/p1/events?key=abc123&token=xyz&page=1');

    expect(safe).not.toContain('abc123');
    expect(safe).not.toContain('xyz');
    expect(safe).toContain('key=[redacted]');
    expect(safe).toContain('page=1');
  });

  it('is case-insensitive about parameter names', () => {
    expect(RequestLogUtils.safeUrl('/x?KEY=secret')).not.toContain('secret');
  });
});

describe('RequestLogUtils.isQuiet', () => {
  it('treats ingest and health traffic as noisy', () => {
    expect(RequestLogUtils.isQuiet('/api/ingest/v1/p/events')).toBe(true);
    expect(RequestLogUtils.isQuiet('/api/health/live')).toBe(true);
    expect(RequestLogUtils.isQuiet('/api/projects')).toBe(false);
  });
});
