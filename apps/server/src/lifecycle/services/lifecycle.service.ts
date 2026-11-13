import { randomUUID } from 'node:crypto';
import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ONLINE_DELAY } from '../constants/lifecycle.constants';
import { InstanceRecord } from '../interfaces/lifecycle.interfaces';
import { LifecycleMessageMapper } from '../mappers/lifecycle-message.mapper';
import { LifecycleRecordRepository } from '../repositories/lifecycle-record.repository';
import { ProjectActivityRepository } from '../repositories/project-activity.repository';
import { LifecycleNotifier } from './lifecycle-notifier.service';

@Injectable()
export class LifecycleService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(LifecycleService.name);
  private readonly instanceId = randomUUID();
  private readonly bootedAt = new Date();
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly recordRepository: LifecycleRecordRepository,
    private readonly activityRepository: ProjectActivityRepository,
    private readonly notifier: LifecycleNotifier,
    @Inject(ONLINE_DELAY) private readonly onlineDelayMs: number,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      const previous = await this.recordRepository.find();
      await this.recordRepository.save(this.record(null));
      if (!previous) {
        return;
      }
      this.timer = setTimeout(() => void this.announceOnline(previous), this.onlineDelayMs);
      this.timer.unref();
    } catch (error) {
      this.logger.error(
        `Could not record the start: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    try {
      const current = await this.recordRepository.find();
      if (current && current.instanceId !== this.instanceId) {
        return;
      }
      await this.recordRepository.save(this.record(new Date()));
      await this.notifier.broadcast(LifecycleMessageMapper.stopping(this.appUrl()));
    } catch (error) {
      this.logger.error(
        `Could not announce the shutdown: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async announceOnline(previous: InstanceRecord): Promise<void> {
    try {
      const message = LifecycleMessageMapper.online({
        version: this.version(),
        previous,
        bootedAt: this.bootedAt,
        projects: await this.activityRepository.list(),
        appUrl: this.appUrl(),
        now: new Date(),
      });
      await this.notifier.broadcast(message);
    } catch (error) {
      this.logger.error(
        `Could not announce that Watchdog is online: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private record(stoppedAt: Date | null): InstanceRecord {
    return {
      instanceId: this.instanceId,
      version: this.version(),
      bootedAt: this.bootedAt.toISOString(),
      stoppedAt: stoppedAt ? stoppedAt.toISOString() : null,
    };
  }

  private version(): string {
    return this.configService.getOrThrow<string>('updates.currentVersion');
  }

  private appUrl(): string {
    return this.configService.getOrThrow<string>('appUrl');
  }
}
