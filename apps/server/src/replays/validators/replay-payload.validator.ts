import { BadRequestException } from '@nestjs/common';
import {
  MAX_CHUNK_BYTES,
  MAX_ERROR_IDS,
  MAX_EVENTS_PER_CHUNK,
  REPLAY_ID_PATTERN,
} from '../constants/replay.constants';
import type { ReplayChunkInput } from '../interfaces/replay.interfaces';

type Json = Record<string, unknown>;
type TimedEvent = Json & { timestamp: number };

export class ReplayPayloadValidator {
  static parse(body: unknown): ReplayChunkInput {
    if (!ReplayPayloadValidator.isRecord(body)) {
      throw new BadRequestException('Replay body must be a JSON object');
    }
    if (typeof body.replayId !== 'string' || !REPLAY_ID_PATTERN.test(body.replayId)) {
      throw new BadRequestException('Replay needs a valid replayId');
    }
    const sequence = Number(body.sequence);
    if (!Number.isInteger(sequence) || sequence < 0) {
      throw new BadRequestException('Replay chunk needs a non-negative integer sequence');
    }
    const events = ReplayPayloadValidator.events(body.events);
    const timestamps = events.map((event) => event.timestamp);
    return {
      replayId: body.replayId,
      sequence,
      events,
      startedAt: new Date(Math.min(...timestamps)),
      lastEventAt: new Date(Math.max(...timestamps)),
      url: ReplayPayloadValidator.text(body.url, 500),
      userAgent: ReplayPayloadValidator.text(body.userAgent, 300),
      release: ReplayPayloadValidator.text(body.release, 200),
      environment: ReplayPayloadValidator.text(body.environment, 100),
      userId: ReplayPayloadValidator.text(body.userId, 200),
      errorEventIds: ReplayPayloadValidator.errorIds(body.errorEventIds),
    };
  }

  private static events(value: unknown): TimedEvent[] {
    if (!Array.isArray(value) || value.length === 0) {
      throw new BadRequestException('Replay chunk needs a non-empty events array');
    }
    if (value.length > MAX_EVENTS_PER_CHUNK) {
      throw new BadRequestException(`At most ${MAX_EVENTS_PER_CHUNK} events per chunk`);
    }
    const valid = value.filter(
      (event): event is TimedEvent =>
        ReplayPayloadValidator.isRecord(event) &&
        typeof event.timestamp === 'number' &&
        Number.isFinite(event.timestamp),
    );
    if (valid.length === 0) {
      throw new BadRequestException('Replay chunk has no valid events');
    }
    if (JSON.stringify(valid).length > MAX_CHUNK_BYTES) {
      throw new BadRequestException('Replay chunk is too large');
    }
    return valid;
  }

  private static errorIds(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .filter((id): id is string => typeof id === 'string' && id.length <= 64)
      .slice(0, MAX_ERROR_IDS);
  }

  private static text(value: unknown, max: number): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }
    const trimmed = value.trim();
    return trimmed ? trimmed.slice(0, max) : undefined;
  }

  private static isRecord(value: unknown): value is Json {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
