import { describe, expect, it } from 'vitest';
import { LifecycleUtils } from './lifecycle.utils';

describe('LifecycleUtils.span', () => {
  it('picks a readable unit', () => {
    expect(LifecycleUtils.span(400)).toBe('1 s');
    expect(LifecycleUtils.span(40_000)).toBe('40 s');
    expect(LifecycleUtils.span(150_000)).toBe('3 min');
    expect(LifecycleUtils.span(3 * 3_600_000)).toBe('3 h');
    expect(LifecycleUtils.span(2 * 86_400_000)).toBe('2 d');
  });
});

describe('LifecycleUtils.downtimeMs', () => {
  it('is the gap between the stop and the start', () => {
    expect(
      LifecycleUtils.downtimeMs(
        { stoppedAt: '2026-01-01T00:00:00.000Z' },
        new Date('2026-01-01T00:02:00.000Z'),
      ),
    ).toBe(120_000);
  });

  it('is unknown without a recorded stop', () => {
    expect(LifecycleUtils.downtimeMs({ stoppedAt: null }, new Date())).toBeNull();
    expect(LifecycleUtils.downtimeMs(null, new Date())).toBeNull();
  });
});

describe('LifecycleUtils.parseRecord', () => {
  it('reads a stored record', () => {
    const raw = JSON.stringify({
      instanceId: 'a',
      version: '0.9.0',
      bootedAt: 'x',
      stoppedAt: null,
    });

    expect(LifecycleUtils.parseRecord(raw)).toEqual({
      instanceId: 'a',
      version: '0.9.0',
      bootedAt: 'x',
      stoppedAt: null,
    });
  });

  it('ignores missing or damaged values', () => {
    expect(LifecycleUtils.parseRecord(null)).toBeNull();
    expect(LifecycleUtils.parseRecord('not json')).toBeNull();
    expect(LifecycleUtils.parseRecord('{"version":"1"}')).toBeNull();
  });
});

describe('LifecycleUtils.withTimeout', () => {
  it('rejects when the work takes too long and passes results through otherwise', async () => {
    await expect(LifecycleUtils.withTimeout(new Promise(() => undefined), 20)).rejects.toThrow(
      'Timed out',
    );
    await expect(LifecycleUtils.withTimeout(Promise.resolve(5), 20)).resolves.toBe(5);
  });
});
