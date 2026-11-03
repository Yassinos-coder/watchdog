import type { Replay } from '../../generated/prisma/client';
import type { ReplayView } from '../interfaces/replay.interfaces';

export class ReplayMapper {
  static toView(replay: Replay): ReplayView {
    return {
      id: replay.id,
      replayId: replay.replayId,
      startedAt: replay.startedAt.toISOString(),
      durationMs: replay.durationMs,
      chunkCount: replay.chunkCount,
      eventCount: replay.eventCount,
      url: replay.url,
      userAgent: replay.userAgent,
      release: replay.release,
      environment: replay.environment,
      userId: replay.userId,
      errorEventIds: replay.errorEventIds,
    };
  }
}
