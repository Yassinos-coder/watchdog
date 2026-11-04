import { describe, expect, it } from 'vitest';
import { SafeFormat } from './utils/format';

describe('SafeFormat.describe', () => {
  it('keeps short strings and numbers readable', () => {
    expect(SafeFormat.describe('hello')).toBe('hello');
    expect(SafeFormat.describe(42)).toBe('42');
    expect(SafeFormat.describe(null)).toBe('null');
    expect(SafeFormat.describe(undefined)).toBe('undefined');
  });

  it('describes small objects and arrays', () => {
    expect(SafeFormat.describe({ id: 1, name: 'Ana' })).toBe('{id:1,name:"Ana"}');
    expect(SafeFormat.describe([1, 2, 3])).toBe('[1,2,3]');
  });

  it('describes errors by name and message', () => {
    expect(SafeFormat.describe(new TypeError('nope'))).toBe('TypeError: nope');
  });

  it('stays small and fast for huge objects', () => {
    const huge = { users: Array.from({ length: 200_000 }, (_, id) => ({ id, name: `user ${id}` })) };
    SafeFormat.describe(huge);
    const start = performance.now();
    const text = SafeFormat.describe(huge);
    const elapsed = performance.now() - start;
    const stringifyStart = performance.now();
    JSON.stringify(huge);
    const stringifyTime = performance.now() - stringifyStart;

    expect(elapsed).toBeLessThan(Math.max(25, stringifyTime / 10));
    expect(text.length).toBeLessThanOrEqual(300);
  });

  it('survives cycles, throwing getters and odd values', () => {
    const cyclic: Record<string, unknown> = { name: 'loop' };
    cyclic.self = cyclic;
    const hostile = {
      get boom(): never {
        throw new Error('getter');
      },
    };

    expect(SafeFormat.describe(cyclic)).toContain('name:"loop"');
    expect(SafeFormat.describe(hostile)).toBe('[unprintable]');
    expect(SafeFormat.describe(() => 1)).toContain('[Function');
    expect(SafeFormat.describe(Symbol('s'))).toBe('Symbol(s)');
  });
});
