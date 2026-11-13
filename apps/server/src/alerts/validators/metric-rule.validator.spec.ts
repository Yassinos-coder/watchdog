import { describe, expect, it } from 'vitest';
import { MetricRuleValidator } from './metric-rule.validator';

const complete = {
  metricSource: 'METRIC' as const,
  metricName: 'voice.latency',
  metricAggregation: 'P95' as const,
  metricComparator: 'ABOVE' as const,
  metricThreshold: 2000,
  metricWindowMins: 5,
};

describe('MetricRuleValidator', () => {
  it('accepts a complete rule', () => {
    expect(MetricRuleValidator.isComplete(complete)).toBe(true);
  });

  it('accepts a zero threshold', () => {
    expect(MetricRuleValidator.isComplete({ ...complete, metricThreshold: 0 })).toBe(true);
  });

  it('rejects missing fields', () => {
    expect(MetricRuleValidator.isComplete({ ...complete, metricThreshold: null })).toBe(false);
    expect(MetricRuleValidator.isComplete({ ...complete, metricWindowMins: null })).toBe(false);
    expect(MetricRuleValidator.isComplete({ ...complete, metricComparator: null })).toBe(false);
  });

  it('requires a metric name only for custom metrics', () => {
    expect(MetricRuleValidator.isComplete({ ...complete, metricName: null })).toBe(false);
    expect(MetricRuleValidator.isComplete({ ...complete, metricSource: 'TRANSACTIONS', metricName: null })).toBe(true);
  });

  it('compares strictly in both directions', () => {
    expect(MetricRuleValidator.isBreached('ABOVE', 3, 2)).toBe(true);
    expect(MetricRuleValidator.isBreached('ABOVE', 2, 2)).toBe(false);
    expect(MetricRuleValidator.isBreached('BELOW', 1, 2)).toBe(true);
    expect(MetricRuleValidator.isBreached('BELOW', 2, 2)).toBe(false);
  });
});
