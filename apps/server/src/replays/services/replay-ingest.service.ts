import { Injectable } from '@nestjs/common';
import { ProjectRateLimiterService } from '../../ingest/services/project-rate-limiter.service';
import { ProjectKeyService } from '../../projects/services/project-key.service';
import { ReplayRepository } from '../repositories/replay.repository';
import { ReplayPayloadValidator } from '../validators/replay-payload.validator';

@Injectable()
export class ReplayIngestService {
  constructor(
    private readonly projectKeyService: ProjectKeyService,
    private readonly rateLimiter: ProjectRateLimiterService,
    private readonly replayRepository: ReplayRepository,
  ) {}

  async accept(projectId: string, publicKey: string | undefined, body: unknown): Promise<{ id: string }> {
    await this.projectKeyService.assertValid(publicKey, projectId);
    this.rateLimiter.consume(projectId);
    const chunk = ReplayPayloadValidator.parse(body);
    await this.replayRepository.appendChunk(projectId, chunk);
    return { id: chunk.replayId };
  }
}
