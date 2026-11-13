import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import {
  ROLLUP_CHUNK_HOURS,
  ROLLUP_HOUR_MS,
  ROLLUP_INTERVAL_MS,
  ROLLUP_REFRESH_OVERLAP_HOURS,
  ROLLUP_STARTUP_DELAY_MS,
} from '../constants/performance.constants';
import { MetricRollupRepository } from '../repositories/metric-rollup.repository';

@Injectable()
export class MetricRollupService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(MetricRollupService.name);
  private timers: NodeJS.Timeout[] = [];
  private running = false;

  constructor(private readonly rollupRepository: MetricRollupRepository) {}

  onApplicationBootstrap(): void {
    if (process.env.NODE_ENV === 'test') {
      return;
    }
    const first = setTimeout(() => void this.runSafely(), ROLLUP_STARTUP_DELAY_MS);
    const recurring = setInterval(() => void this.runSafely(), ROLLUP_INTERVAL_MS);
    first.unref();
    recurring.unref();
    this.timers = [first, recurring];
  }

  onApplicationShutdown(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers = [];
  }

  async run(now = Date.now()): Promise<number> {
    const start = await this.startHour();
    if (start === null) {
      return 0;
    }
    const end = this.hourStart(now) + ROLLUP_HOUR_MS;
    const chunkMs = ROLLUP_CHUNK_HOURS * ROLLUP_HOUR_MS;
    let written = 0;
    for (let from = start; from < end; from += chunkMs) {
      written += await this.rollupRepository.refresh(new Date(from), new Date(Math.min(from + chunkMs, end)));
    }
    return written;
  }

  private async startHour(): Promise<number | null> {
    const latest = await this.rollupRepository.latestBucket();
    if (latest) {
      return this.hourStart(latest.getTime()) - ROLLUP_REFRESH_OVERLAP_HOURS * ROLLUP_HOUR_MS;
    }
    const earliest = await this.rollupRepository.earliestMetric();
    return earliest ? this.hourStart(earliest.getTime()) : null;
  }

  private hourStart(timestamp: number): number {
    return Math.floor(timestamp / ROLLUP_HOUR_MS) * ROLLUP_HOUR_MS;
  }

  private async runSafely(): Promise<void> {
    if (this.running) {
      return;
    }
    this.running = true;
    try {
      await this.run();
    } catch (error) {
      this.logger.error(`Metric rollup failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      this.running = false;
    }
  }
}
