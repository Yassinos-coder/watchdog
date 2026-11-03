import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RetentionPolicy, RetentionResult } from '../interfaces/retention.interfaces';
import { RetentionRepository } from '../repositories/retention.repository';
import { RetentionUtils } from '../utils/retention.utils';

const HOUR_MS = 3_600_000;
const STARTUP_DELAY_MS = 60_000;

@Injectable()
export class RetentionService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(RetentionService.name);
  private readonly policy: RetentionPolicy;
  private timers: NodeJS.Timeout[] = [];

  constructor(
    configService: ConfigService,
    private readonly retentionRepository: RetentionRepository,
  ) {
    this.policy = configService.getOrThrow<RetentionPolicy>('retention');
  }

  onApplicationBootstrap(): void {
    if (process.env.NODE_ENV === 'test') {
      return;
    }
    const first = setTimeout(() => void this.runSafely(), STARTUP_DELAY_MS);
    const recurring = setInterval(() => void this.runSafely(), 6 * HOUR_MS);
    first.unref();
    recurring.unref();
    this.timers = [first, recurring];
  }

  onApplicationShutdown(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers = [];
  }

  async run(now = Date.now()): Promise<RetentionResult> {
    const eventCutoff = RetentionUtils.cutoff(this.policy.eventDays, now);
    const performanceCutoff = RetentionUtils.cutoff(this.policy.performanceDays, now);
    const replayCutoff = RetentionUtils.cutoff(this.policy.replayDays, now);

    return {
      issues: eventCutoff ? await this.retentionRepository.deleteIssuesBefore(eventCutoff) : 0,
      events: eventCutoff ? await this.retentionRepository.deleteEventsBefore(eventCutoff) : 0,
      transactions: performanceCutoff
        ? await this.retentionRepository.deleteTransactionsBefore(performanceCutoff)
        : 0,
      metrics: performanceCutoff ? await this.retentionRepository.deleteMetricsBefore(performanceCutoff) : 0,
      replays: replayCutoff ? await this.retentionRepository.deleteReplaysBefore(replayCutoff) : 0,
    };
  }

  private async runSafely(): Promise<void> {
    try {
      const result = await this.run();
      const total = Object.values(result).reduce((sum, count) => sum + count, 0);
      if (total > 0) {
        this.logger.log(`Retention removed ${JSON.stringify(result)}`);
      }
    } catch (error) {
      this.logger.error(`Retention run failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
