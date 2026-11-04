import { describe, expect, it } from 'vitest';
import { ThresholdUtils } from './threshold.utils';

describe('ThresholdUtils.latency', () => {
  it('judges web requests against the strictest limits', () => {
    expect(ThresholdUtils.latency(120, 'http.server')).toBe('good');
    expect(ThresholdUtils.latency(500, 'http.server')).toBe('warning');
    expect(ThresholdUtils.latency(1_499, 'http.server')).toBe('warning');
    expect(ThresholdUtils.latency(1_500, 'http.server')).toBe('critical');
  });

  it('uses the limits of the kind of work, including dotted sub-types', () => {
    expect(ThresholdUtils.latency(150, 'db')).toBe('warning');
    expect(ThresholdUtils.latency(150, 'db.query')).toBe('warning');
    expect(ThresholdUtils.latency(150, 'http.client')).toBe('good');
    expect(ThresholdUtils.latency(3_000, 'http.client')).toBe('critical');
    expect(ThresholdUtils.latency(30, 'cache')).toBe('warning');
  });

  it('does not color work whose normal duration is unknown', () => {
    expect(ThresholdUtils.latency(600_000, 'call')).toBe('good');
    expect(ThresholdUtils.latency(90_000, 'job')).toBe('good');
    expect(ThresholdUtils.latency(5, 'default')).toBe('good');
  });

  it('does not match an op that only starts with the same letters', () => {
    expect(ThresholdUtils.limitsFor('dbx')).toBeNull();
    expect(ThresholdUtils.limitsFor('httpish')).toBeNull();
  });

  it('treats a missing value as fine', () => {
    expect(ThresholdUtils.latency(null, 'http.server')).toBe('good');
    expect(ThresholdUtils.latency(undefined, 'http.server')).toBe('good');
  });
});

describe('ThresholdUtils.failure', () => {
  it('flags rising failure rates', () => {
    expect(ThresholdUtils.failure(0)).toBe('good');
    expect(ThresholdUtils.failure(0.0099)).toBe('good');
    expect(ThresholdUtils.failure(0.01)).toBe('warning');
    expect(ThresholdUtils.failure(0.049)).toBe('warning');
    expect(ThresholdUtils.failure(0.05)).toBe('critical');
  });
});
