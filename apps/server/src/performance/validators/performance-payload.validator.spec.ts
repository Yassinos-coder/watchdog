import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { PerformancePayloadValidator } from './performance-payload.validator';

describe('PerformancePayloadValidator.parseTransaction', () => {
  it('requires a name and a duration', () => {
    expect(() => PerformancePayloadValidator.parseTransaction({ durationMs: 5 })).toThrow(BadRequestException);
    expect(() => PerformancePayloadValidator.parseTransaction({ name: 'GET /x' })).toThrow(BadRequestException);
    expect(() => PerformancePayloadValidator.parseTransaction({ name: 'x', durationMs: -1 })).toThrow(
      BadRequestException,
    );
  });

  it('fills defaults and drops malformed spans', () => {
    const parsed = PerformancePayloadValidator.parseTransaction({
      name: 'GET /users',
      durationMs: 120.5,
      spans: [{ op: 'db', startOffsetMs: 1, durationMs: 40 }, { op: 'db' }, 'nope'],
      tags: { region: 'eu', n: 3, nested: { a: 1 } },
    });

    expect(parsed.op).toBe('default');
    expect(parsed.status).toBe('ok');
    expect(parsed.spans).toHaveLength(1);
    expect(parsed.tags).toEqual({ region: 'eu', n: '3' });
  });
});

describe('PerformancePayloadValidator.parseMetrics', () => {
  it('rejects a body without a metrics array', () => {
    expect(() => PerformancePayloadValidator.parseMetrics({})).toThrow(BadRequestException);
  });

  it('keeps valid metrics and drops invalid ones', () => {
    const parsed = PerformancePayloadValidator.parseMetrics({
      metrics: [
        { name: 'cart.value', value: 42, type: 'distribution' },
        { name: 'bad name!', value: 1 },
        { name: 'ok', value: 'x' },
        { name: 'queue.depth', value: 3 },
      ],
    });

    expect(parsed.map((metric) => metric.name)).toEqual(['cart.value', 'queue.depth']);
    expect(parsed[0].type).toBe('DISTRIBUTION');
    expect(parsed[1].type).toBe('GAUGE');
  });
});
