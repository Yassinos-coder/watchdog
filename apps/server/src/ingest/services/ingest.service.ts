import { Injectable } from '@nestjs/common';
import { ProjectKeyService } from '../../projects/services/project-key.service';
import { SymbolicationService } from '../../source-maps/services/symbolication.service';
import { IngestResult } from '../interfaces/ingest.interfaces';
import { EventSummaryMapper } from '../mappers/event-summary.mapper';
import { IngestRepository } from '../repositories/ingest.repository';
import { FingerprintUtils } from '../utils/fingerprint.utils';
import { EventPayloadValidator } from '../validators/event-payload.validator';
import { ProjectRateLimiterService } from './project-rate-limiter.service';

@Injectable()
export class IngestService {
  constructor(
    private readonly projectKeyService: ProjectKeyService,
    private readonly rateLimiter: ProjectRateLimiterService,
    private readonly symbolicationService: SymbolicationService,
    private readonly ingestRepository: IngestRepository,
  ) {}

  async accept(projectId: string, publicKey: string | undefined, body: unknown): Promise<IngestResult> {
    await this.projectKeyService.assertValid(publicKey, projectId);
    this.rateLimiter.consume(projectId);

    const event = EventPayloadValidator.parse(body);
    if (event.exception) {
      event.exception.frames = await this.symbolicationService.symbolicate(
        projectId,
        event.release,
        event.exception.frames,
      );
    }
    return this.ingestRepository.record({
      projectId,
      event,
      fingerprint: FingerprintUtils.compute(event),
      title: EventSummaryMapper.toTitle(event),
      culprit: EventSummaryMapper.toCulprit(event),
    });
  }
}
