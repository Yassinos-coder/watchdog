import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { ReplayPayloadValidator } from './replay-payload.validator';

const valid = {
  replayId: 'replay-12345',
  sequence: 0,
  events: [
    { type: 2, timestamp: 2000 },
    { type: 3, timestamp: 1000 },
  ],
};

describe('ReplayPayloadValidator.parse', () => {
  it('rejects bad replay ids, sequences and empty chunks', () => {
    expect(() => ReplayPayloadValidator.parse({ ...valid, replayId: 'x' })).toThrow(BadRequestException);
    expect(() => ReplayPayloadValidator.parse({ ...valid, sequence: -1 })).toThrow(BadRequestException);
    expect(() => ReplayPayloadValidator.parse({ ...valid, events: [] })).toThrow(BadRequestException);
    expect(() => ReplayPayloadValidator.parse({ ...valid, events: [{ type: 2 }] })).toThrow(
      BadRequestException,
    );
  });

  it('derives the time range from event timestamps', () => {
    const parsed = ReplayPayloadValidator.parse(valid);

    expect(parsed.startedAt.getTime()).toBe(1000);
    expect(parsed.lastEventAt.getTime()).toBe(2000);
  });
});
