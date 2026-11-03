import { describe, expect, it } from 'vitest';
import { IngestEvent } from '../interfaces/ingest.interfaces';
import { EventSummaryMapper } from './event-summary.mapper';

const baseEvent = (overrides: Partial<IngestEvent>): IngestEvent => ({
  eventId: 'e1',
  timestamp: new Date(),
  level: 'error',
  platform: 'javascript',
  message: 'Boom',
  breadcrumbs: [],
  tags: {},
  extra: {},
  contexts: {},
  ...overrides,
});

describe('EventSummaryMapper', () => {
  it('uses the first line of the message as the title, capped in length', () => {
    expect(EventSummaryMapper.toTitle(baseEvent({ message: 'First\nSecond' }))).toBe('First');
    expect(EventSummaryMapper.toTitle(baseEvent({ message: 'x'.repeat(500) }))).toHaveLength(200);
  });

  it('points the culprit at the newest in-app frame', () => {
    const event = baseEvent({
      exception: {
        type: 'Error',
        value: 'v',
        handled: true,
        frames: [
          { filename: 'src/entry.ts', function: 'main', lineno: 1, inApp: true },
          { filename: 'src/service.ts', function: 'save', lineno: 42, inApp: true },
          { filename: 'node_modules/lib.js', function: 'lib', lineno: 7, inApp: false },
        ],
      },
    });

    expect(EventSummaryMapper.toCulprit(event)).toBe('save (src/service.ts:42)');
  });

  it('returns null when there is no stack trace', () => {
    expect(EventSummaryMapper.toCulprit(baseEvent({}))).toBeNull();
  });
});
