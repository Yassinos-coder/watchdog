import { Injectable } from '@nestjs/common';
import { ProjectRateLimiterService } from '../../ingest/services/project-rate-limiter.service';
import { ProjectKeyService } from '../../projects/services/project-key.service';
import { MetricRepository } from '../repositories/metric.repository';
import { TransactionRepository } from '../repositories/transaction.repository';
import { PerformancePayloadValidator } from '../validators/performance-payload.validator';

@Injectable()
export class PerformanceIngestService {
  constructor(
    private readonly projectKeyService: ProjectKeyService,
    private readonly rateLimiter: ProjectRateLimiterService,
    private readonly transactionRepository: TransactionRepository,
    private readonly metricRepository: MetricRepository,
  ) {}

  async acceptTransaction(
    projectId: string,
    publicKey: string | undefined,
    body: unknown,
  ): Promise<{ id: string }> {
    await this.authorize(projectId, publicKey);
    const transaction = PerformancePayloadValidator.parseTransaction(body);
    await this.transactionRepository.insert(projectId, transaction);
    return { id: transaction.eventId };
  }

  async acceptMetrics(
    projectId: string,
    publicKey: string | undefined,
    body: unknown,
  ): Promise<{ accepted: number }> {
    await this.authorize(projectId, publicKey);
    const metrics = PerformancePayloadValidator.parseMetrics(body);
    const accepted = await this.metricRepository.insertMany(projectId, metrics);
    return { accepted };
  }

  private async authorize(projectId: string, publicKey: string | undefined): Promise<void> {
    await this.projectKeyService.assertValid(publicKey, projectId);
    this.rateLimiter.consume(projectId);
  }
}
