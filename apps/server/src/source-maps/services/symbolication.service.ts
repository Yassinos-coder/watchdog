import { Injectable, Logger } from '@nestjs/common';
import { originalPositionFor, sourceContentFor, TraceMap } from '@jridgewell/trace-mapping';
import { CONTEXT_RADIUS } from '../../ingest/constants/ingest.constants';
import { IngestFrame } from '../../ingest/interfaces/ingest.interfaces';
import { SourceMapRepository } from '../repositories/source-map.repository';
import { SourceMapPathUtils } from '../utils/source-map-path.utils';

const MAX_CACHED_MAPS = 64;
const VENDOR_PATTERN = /node_modules|^webpack|^vite\/|\/\.vite\//;

@Injectable()
export class SymbolicationService {
  private readonly logger = new Logger(SymbolicationService.name);
  private readonly cache = new Map<string, TraceMap>();

  constructor(private readonly sourceMapRepository: SourceMapRepository) {}

  async symbolicate(
    projectId: string,
    version: string | undefined,
    frames: IngestFrame[],
  ): Promise<IngestFrame[]> {
    if (!version || frames.length === 0) {
      return frames;
    }
    const release = await this.sourceMapRepository.findRelease(projectId, version);
    if (!release) {
      return frames;
    }
    const resolved: IngestFrame[] = [];
    for (const frame of frames) {
      resolved.push(await this.symbolicateFrame(release.id, frame));
    }
    return resolved;
  }

  private async symbolicateFrame(releaseId: string, frame: IngestFrame): Promise<IngestFrame> {
    if (!frame.filename || frame.lineno === undefined) {
      return frame;
    }
    const trace = await this.loadTrace(releaseId, frame.filename);
    if (!trace) {
      return frame;
    }
    const position = originalPositionFor(trace, {
      line: frame.lineno,
      column: Math.max((frame.colno ?? 1) - 1, 0),
    });
    if (position.source === null || position.line === null) {
      return frame;
    }
    const content = sourceContentFor(trace, position.source);
    return {
      ...frame,
      ...this.contextFor(content, position.line),
      filename: position.source.replace(/^(\.\.\/)+/, ''),
      function: position.name ?? frame.function,
      lineno: position.line,
      colno: (position.column ?? 0) + 1,
      inApp: !VENDOR_PATTERN.test(position.source),
      symbolicated: true,
    };
  }

  private contextFor(
    content: string | null,
    line: number,
  ): Pick<IngestFrame, 'contextLine' | 'preContext' | 'postContext'> {
    if (!content) {
      return {};
    }
    const lines = content.split(/\r?\n/);
    const index = line - 1;
    if (index < 0 || index >= lines.length) {
      return {};
    }
    return {
      contextLine: lines[index],
      preContext: lines.slice(Math.max(index - CONTEXT_RADIUS, 0), index),
      postContext: lines.slice(index + 1, index + 1 + CONTEXT_RADIUS),
    };
  }

  private async loadTrace(releaseId: string, filename: string): Promise<TraceMap | null> {
    const candidates = SourceMapPathUtils.candidates(filename);
    if (candidates.length === 0) {
      return null;
    }
    const cacheKey = `${releaseId}:${candidates[0]}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }
    const matches = await this.sourceMapRepository.findByPaths(releaseId, candidates);
    const best = candidates
      .map((candidate) => matches.find((match) => match.filePath === candidate))
      .find((match) => match !== undefined);
    if (!best) {
      return null;
    }
    try {
      const trace = new TraceMap(Buffer.from(best.content).toString('utf8'));
      this.remember(cacheKey, trace);
      return trace;
    } catch {
      this.logger.warn(`Unreadable source map for ${best.filePath}`);
      return null;
    }
  }

  private remember(key: string, trace: TraceMap): void {
    if (this.cache.size >= MAX_CACHED_MAPS) {
      const oldest = this.cache.keys().next().value;
      if (oldest !== undefined) {
        this.cache.delete(oldest);
      }
    }
    this.cache.set(key, trace);
  }
}
