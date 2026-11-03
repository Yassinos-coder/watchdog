import { describe, expect, it } from 'vitest';
import { IngestEvent, IngestFrame } from '../interfaces/ingest.interfaces';
import { FingerprintUtils } from './fingerprint.utils';

const frame = (overrides: Partial<IngestFrame>): IngestFrame => ({
  filename: 'src/app.ts',
  function: 'handler',
  lineno: 10,
  inApp: true,
  ...overrides,
});

const errorEvent = (frames: IngestFrame[], overrides: Partial<IngestEvent> = {}): IngestEvent => ({
  eventId: 'event-1',
  timestamp: new Date(),
  level: 'error',
  platform: 'javascript',
  message: 'TypeError: x is undefined',
  exception: { type: 'TypeError', value: 'x is undefined', handled: true, frames },
  breadcrumbs: [],
  tags: {},
  extra: {},
  contexts: {},
  ...overrides,
});

describe('FingerprintUtils.compute', () => {
  it('groups the same error from different line numbers and releases', () => {
    const a = errorEvent([frame({ lineno: 10 })]);
    const b = errorEvent([frame({ lineno: 99 })], { release: '2.0.0' });

    expect(FingerprintUtils.compute(a)).toBe(FingerprintUtils.compute(b));
  });

  it('separates different error types', () => {
    const a = errorEvent([frame({})]);
    const b = errorEvent([frame({})]);
    b.exception!.type = 'RangeError';

    expect(FingerprintUtils.compute(a)).not.toBe(FingerprintUtils.compute(b));
  });

  it('separates different in-app functions', () => {
    const a = errorEvent([frame({ function: 'save' })]);
    const b = errorEvent([frame({ function: 'load' })]);

    expect(FingerprintUtils.compute(a)).not.toBe(FingerprintUtils.compute(b));
  });

  it('ignores vendor frames when in-app frames exist', () => {
    const vendor = frame({ filename: 'node_modules/lib/index.js', function: 'a', inApp: false });
    const other = frame({ filename: 'node_modules/other/index.js', function: 'b', inApp: false });

    expect(FingerprintUtils.compute(errorEvent([vendor, frame({})]))).toBe(
      FingerprintUtils.compute(errorEvent([other, frame({})])),
    );
  });

  it('treats hashed bundle names as the same file across builds', () => {
    const a = errorEvent([frame({ filename: 'https://x.com/assets/index-AbCd1234.js' })]);
    const b = errorEvent([frame({ filename: 'https://x.com/assets/index-ZyXw9876.js' })]);

    expect(FingerprintUtils.compute(a)).toBe(FingerprintUtils.compute(b));
  });

  it('uses a custom fingerprint when provided', () => {
    const a = errorEvent([frame({})], { fingerprint: ['checkout', 'payment-failed'] });
    const b = errorEvent([frame({ function: 'other' })], {
      fingerprint: ['checkout', 'payment-failed'],
    });

    expect(FingerprintUtils.compute(a)).toBe(FingerprintUtils.compute(b));
  });

  it('falls back to the normalized message when there are no frames', () => {
    const a = errorEvent([], {});
    a.exception!.value = 'User 1234 not found';
    const b = errorEvent([], {});
    b.exception!.value = 'User 9876 not found';

    expect(FingerprintUtils.compute(a)).toBe(FingerprintUtils.compute(b));
  });

  it('groups plain messages by their normalized text', () => {
    const base = { exception: undefined };
    const a = errorEvent([], { ...base, message: 'Order 42 failed for "alice"' });
    const b = errorEvent([], { ...base, message: 'Order 77 failed for "bob"' });

    expect(FingerprintUtils.compute(a)).toBe(FingerprintUtils.compute(b));
  });
});

describe('FingerprintUtils.normalizeMessage', () => {
  it('masks uuids, hex ids, numbers and quoted values', () => {
    const message = 'Failed 3f2b8c1a-1111-2222-3333-444455556666 id=abcdef0123456789 count 42 "name"';

    expect(FingerprintUtils.normalizeMessage(message)).toBe('Failed <uuid> id=<hex> count <n> <str>');
  });
});

describe('FingerprintUtils.normalizeFilename', () => {
  it('strips origin, query and bundle hashes', () => {
    expect(
      FingerprintUtils.normalizeFilename('https://app.example.com/assets/main-Ab12Cd34.js?v=3#x'),
    ).toBe('/assets/main-*.js');
  });
});
