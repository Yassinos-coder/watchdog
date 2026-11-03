import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ISSUE_EVENT_RECORDED } from '../../alerts/constants/alert.constants';
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
    private readonly eventEmitter: EventEmitter2,
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
    const result = await this.ingestRepository.record({
      projectId,
      event,
      fingerprint: FingerprintUtils.compute(event),
      title: EventSummaryMapper.toTitle(event),
      culprit: EventSummaryMapper.toCulprit(event),
    });
    if (!result.duplicate) {
      this.eventEmitter.emit(ISSUE_EVENT_RECORDED, {
        projectId,
        issueId: result.issueId,
        isNewIssue: result.isNewIssue,
        isRegression: result.isRegression,
        level: event.level,
        environment: event.environment ?? null,
        release: event.release ?? null,
      });
    }
    return result;
  }
}
