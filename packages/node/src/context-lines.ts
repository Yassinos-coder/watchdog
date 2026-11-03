import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Frame } from '@watchdog-sdk/core';

const CONTEXT_RADIUS = 5;
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_CACHED_FILES = 100;
const MAX_LINE_LENGTH = 400;

export class ContextLines {
  private static readonly cache = new Map<string, string[] | null>();

  static enrich(frames: Frame[]): Frame[] {
    return frames.map((frame) => ContextLines.enrichFrame(frame));
  }

  static resolvePath(filename: string): string | null {
    if (/^https?:\/\//.test(filename) || filename.startsWith('node:')) {
      return null;
    }
    if (filename.startsWith('file://')) {
      try {
        return fileURLToPath(filename);
      } catch {
        return null;
      }
    }
    return filename;
  }

  static clearCache(): void {
    ContextLines.cache.clear();
  }

  private static enrichFrame(frame: Frame): Frame {
    if (frame.inApp === false || !frame.filename || frame.lineno === undefined) {
      return frame;
    }
    const path = ContextLines.resolvePath(frame.filename);
    const lines = path ? ContextLines.readLines(path) : null;
    if (!lines || frame.lineno < 1 || frame.lineno > lines.length) {
      return frame;
    }
    const index = frame.lineno - 1;
    return {
      ...frame,
      contextLine: ContextLines.clip(lines[index]),
      preContext: lines.slice(Math.max(index - CONTEXT_RADIUS, 0), index).map(ContextLines.clip),
      postContext: lines.slice(index + 1, index + 1 + CONTEXT_RADIUS).map(ContextLines.clip),
    };
  }

  private static readLines(path: string): string[] | null {
    if (ContextLines.cache.has(path)) {
      return ContextLines.cache.get(path) ?? null;
    }
    const lines = ContextLines.load(path);
    if (ContextLines.cache.size >= MAX_CACHED_FILES) {
      const oldest = ContextLines.cache.keys().next().value;
      if (oldest !== undefined) {
        ContextLines.cache.delete(oldest);
      }
    }
    ContextLines.cache.set(path, lines);
    return lines;
  }

  private static load(path: string): string[] | null {
    try {
      if (statSync(path).size > MAX_FILE_BYTES) {
        return null;
      }
      return readFileSync(path, 'utf8').split(/\r?\n/);
    } catch {
      return null;
    }
  }

  private static clip(line: string): string {
    return line.length > MAX_LINE_LENGTH ? line.slice(0, MAX_LINE_LENGTH) : line;
  }
}
