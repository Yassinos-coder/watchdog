import { createHash } from 'node:crypto';
import { FINGERPRINT_FRAME_LIMIT } from '../constants/ingest.constants';
import { IngestEvent, IngestFrame } from '../interfaces/ingest.interfaces';

const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const HEX_PATTERN = /\b[0-9a-f]{12,}\b/gi;
const NUMBER_PATTERN = /\b\d+(\.\d+)?\b/g;
const QUOTED_PATTERN = /(["'`])(?:(?!\1).){1,80}\1/g;
const BUNDLE_HASH_PATTERN = /([.\-_])[A-Za-z0-9_-]{6,}(?=\.(?:m?js|cjs|jsx?|tsx?|map)$)/;

export class FingerprintUtils {
  static compute(event: IngestEvent): string {
    const parts = event.fingerprint ?? FingerprintUtils.derive(event);
    return createHash('sha1').update(parts.join('\n')).digest('hex');
  }

  static normalizeMessage(message: string): string {
    return message
      .replace(UUID_PATTERN, '<uuid>')
      .replace(HEX_PATTERN, '<hex>')
      .replace(QUOTED_PATTERN, '<str>')
      .replace(NUMBER_PATTERN, '<n>')
      .slice(0, 300);
  }

  static normalizeFilename(filename: string): string {
    const withoutQuery = filename.split(/[?#]/)[0];
    const path = withoutQuery.replace(/^[a-z][a-z0-9+.-]*:\/\/[^/]+/i, '');
    return path.replace(BUNDLE_HASH_PATTERN, '$1*');
  }

  private static derive(event: IngestEvent): string[] {
    if (!event.exception) {
      return ['message', FingerprintUtils.normalizeMessage(event.message)];
    }
    const frames = FingerprintUtils.significantFrames(event.exception.frames);
    if (frames.length === 0) {
      return [
        event.exception.type,
        FingerprintUtils.normalizeMessage(event.exception.value),
      ];
    }
    return [
      event.exception.type,
      ...frames.map(
        (frame) => `${FingerprintUtils.normalizeFilename(frame.filename ?? '')}:${frame.function ?? '?'}`,
      ),
    ];
  }

  private static significantFrames(frames: IngestFrame[]): IngestFrame[] {
    const newestFirst = [...frames].reverse();
    const inApp = newestFirst.filter((frame) => frame.inApp === true);
    const pool = inApp.length > 0 ? inApp : newestFirst;
    return pool.slice(0, FINGERPRINT_FRAME_LIMIT);
  }
}
