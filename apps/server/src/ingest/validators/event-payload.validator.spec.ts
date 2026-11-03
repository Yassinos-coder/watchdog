import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { MAX_BREADCRUMBS, MAX_FRAMES } from '../constants/ingest.constants';
import { EventPayloadValidator } from './event-payload.validator';

describe('EventPayloadValidator.parse', () => {
  it('rejects non-object bodies', () => {
    expect(() => EventPayloadValidator.parse(null)).toThrow(BadRequestException);
    expect(() => EventPayloadValidator.parse('text')).toThrow(BadRequestException);
    expect(() => EventPayloadValidator.parse([])).toThrow(BadRequestException);
  });

  it('requires a message or an exception', () => {
    expect(() => EventPayloadValidator.parse({})).toThrow(BadRequestException);
  });

  it('parses a plain message event with sensible defaults', () => {
    const event = EventPayloadValidator.parse({ message: 'Something happened' });

    expect(event.message).toBe('Something happened');
    expect(event.level).toBe('info');
    expect(event.platform).toBe('javascript');
    expect(event.eventId).toMatch(/^[0-9a-f-]{36}$/);
    expect(event.breadcrumbs).toEqual([]);
    expect(event.tags).toEqual({});
  });

  it('derives the message and level from an exception', () => {
    const event = EventPayloadValidator.parse({
      exception: {
        type: 'TypeError',
        value: 'x is undefined',
        stacktrace: { frames: [{ filename: 'a.js', function: 'f', lineno: 3, colno: 5 }] },
      },
    });

    expect(event.message).toBe('TypeError: x is undefined');
    expect(event.level).toBe('error');
    expect(event.exception?.frames[0]).toMatchObject({ filename: 'a.js', lineno: 3, colno: 5 });
    expect(event.exception?.handled).toBe(true);
  });

  it('keeps a valid event id and replaces an invalid one', () => {
    expect(EventPayloadValidator.parse({ message: 'm', eventId: 'abcdef12-3456' }).eventId).toBe(
      'abcdef12-3456',
    );
    expect(EventPayloadValidator.parse({ message: 'm', eventId: '!!' }).eventId).not.toBe('!!');
  });

  it('accepts seconds, milliseconds and ISO timestamps', () => {
    const iso = '2026-01-02T03:04:05.000Z';
    const ms = Date.parse(iso);

    expect(EventPayloadValidator.parse({ message: 'm', timestamp: iso }).timestamp.getTime()).toBe(ms);
    expect(EventPayloadValidator.parse({ message: 'm', timestamp: ms }).timestamp.getTime()).toBe(ms);
    expect(
      EventPayloadValidator.parse({ message: 'm', timestamp: ms / 1000 }).timestamp.getTime(),
    ).toBe(ms);
  });

  it('replaces timestamps far in the future', () => {
    const event = EventPayloadValidator.parse({ message: 'm', timestamp: Date.now() + 10 * 86_400_000 });

    expect(event.timestamp.getTime()).toBeLessThan(Date.now() + 1_000);
  });

  it('ignores unknown levels', () => {
    expect(EventPayloadValidator.parse({ message: 'm', level: 'catastrophe' }).level).toBe('info');
    expect(EventPayloadValidator.parse({ message: 'm', level: 'warning' }).level).toBe('warning');
  });

  it('caps frames and breadcrumbs, keeping the most recent', () => {
    const frames = Array.from({ length: MAX_FRAMES + 20 }, (_, index) => ({ lineno: index }));
    const breadcrumbs = Array.from({ length: MAX_BREADCRUMBS + 20 }, (_, index) => ({
      message: `crumb ${index}`,
    }));

    const event = EventPayloadValidator.parse({
      exception: { type: 'E', value: 'v', stacktrace: { frames } },
      breadcrumbs,
    });

    expect(event.exception?.frames).toHaveLength(MAX_FRAMES);
    expect(event.exception?.frames.at(-1)?.lineno).toBe(MAX_FRAMES + 19);
    expect(event.breadcrumbs).toHaveLength(MAX_BREADCRUMBS);
  });

  it('coerces tags to strings and drops non-primitive values', () => {
    const event = EventPayloadValidator.parse({
      message: 'm',
      tags: { region: 'eu', retries: 3, nested: { a: 1 }, ok: true },
    });

    expect(event.tags).toEqual({ region: 'eu', retries: '3', ok: 'true' });
  });

  it('keeps the indentation of source code lines', () => {
    const event = EventPayloadValidator.parse({
      exception: {
        type: 'E',
        value: 'v',
        stacktrace: {
          frames: [
            {
              filename: 'a.ts',
              lineno: 3,
              contextLine: '    return total;',
              preContext: ['  if (ready) {'],
              postContext: ['  }'],
            },
          ],
        },
      },
    });

    expect(event.exception?.frames[0]).toMatchObject({
      contextLine: '    return total;',
      preContext: ['  if (ready) {'],
      postContext: ['  }'],
    });
  });

  it('replaces oversized extra data with a marker', () => {
    const event = EventPayloadValidator.parse({ message: 'm', extra: { blob: 'x'.repeat(100_000) } });

    expect(event.extra).toEqual({ _truncated: true });
  });

  it('only keeps a custom fingerprint made of strings', () => {
    expect(EventPayloadValidator.parse({ message: 'm', fingerprint: ['a', 'b'] }).fingerprint).toEqual([
      'a',
      'b',
    ]);
    expect(EventPayloadValidator.parse({ message: 'm', fingerprint: [1, 2] }).fingerprint).toBeUndefined();
  });
});
