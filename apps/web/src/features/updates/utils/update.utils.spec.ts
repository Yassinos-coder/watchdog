import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateUtils } from './update.utils';

const store = new Map<string, string>();

beforeEach(() => {
  store.clear();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
    },
  });
});

describe('UpdateUtils', () => {
  it('remembers which version was dismissed', () => {
    expect(UpdateUtils.isDismissed('0.5.0')).toBe(false);

    UpdateUtils.dismiss('0.5.0');

    expect(UpdateUtils.isDismissed('0.5.0')).toBe(true);
    expect(UpdateUtils.isDismissed('0.6.0')).toBe(false);
  });

  it('survives storage being unavailable', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: () => {
          throw new Error('blocked');
        },
        setItem: () => {
          throw new Error('blocked');
        },
      },
    });

    expect(UpdateUtils.isDismissed('0.5.0')).toBe(false);
    expect(() => UpdateUtils.dismiss('0.5.0')).not.toThrow();
  });
});
