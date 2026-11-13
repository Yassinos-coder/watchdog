import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SeriesRepository } from '../../performance/repositories/series.repository';
import { ProjectRepository } from '../../projects/repositories/project.repository';
import {
  ALERT_TRIGGERED,
  METRIC_EVALUATION_INTERVAL_MS,
  METRIC_EVALUATION_STARTUP_DELAY_MS,
  MINUTE_MS,
} from '../constants/alert.constants';
import { MetricRuleSpec } from '../interfaces/alert.interfaces';
import { AlertMessageMapper } from '../mappers/alert-message.mapper';
import { AlertDeliveryRepository } from '../repositories/alert-delivery.repository';
import { AlertRuleRepository, RuleWithChannels } from '../repositories/alert-rule.repository';
import { MetricRuleValidator } from '../validators/metric-rule.validator';
import { AlertDispatchService } from './alert-dispatch.service';

@Injectable()
export class MetricAlertService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(MetricAlertService.name);
  private timers: NodeJS.Timeout[] = [];
  private running = false;

  constructor(
    private readonly ruleRepository: AlertRuleRepository,
    private readonly deliveryRepository: AlertDeliveryRepository,
    private readonly dispatchService: AlertDispatchService,
    private readonly seriesRepository: SeriesRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  onApplicationBootstrap(): void {
    if (process.env.NODE_ENV === 'test') {
      return;
    }
    const first = setTimeout(() => void this.runSafely(), METRIC_EVALUATION_STARTUP_DELAY_MS);
    const recurring = setInterval(() => void this.runSafely(), METRIC_EVALUATION_INTERVAL_MS);
    first.unref();
    recurring.unref();
    this.timers = [first, recurring];
  }

  onApplicationShutdown(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers = [];
  }

  async evaluateAll(now = Date.now()): Promise<void> {
    const rules = await this.ruleRepository.findAllActive('METRIC');
    for (const rule of rules) {
      try {
        await this.evaluate(rule, now);
      } catch (error) {
        this.logger.error(
          `Metric alert "${rule.name}" failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }

  async evaluate(rule: RuleWithChannels, now = Date.now()): Promise<void> {
    const spec = MetricRuleValidator.toSpec(rule);
    if (!spec || !rule.channels.some((channel) => channel.enabled) || (await this.inCooldown(rule, now))) {
      return;
    }
    const value = await this.measure(rule, spec, now);
    if (value === null || !MetricRuleValidator.isBreached(spec.comparator, value, spec.threshold)) {
      return;
    }
    const project = await this.projectRepository.findById(rule.projectId);
    if (!project) {
      return;
    }
    const message = AlertMessageMapper.fromMetric(
      {
        source: spec.source,
        name: spec.name ?? 'All transactions',
        aggregation: spec.aggregation,
        comparator: spec.comparator,
        threshold: spec.threshold,
        value,
        windowMins: spec.windowMins,
      },
      {
        projectId: project.id,
        projectName: project.name,
        environment: rule.environment,
        appUrl: this.configService.getOrThrow<string>('appUrl'),
      },
    );
    this.eventEmitter.emit(ALERT_TRIGGERED, {
      type: 'metric.alert',
      projectId: rule.projectId,
      rule: { id: rule.id, name: rule.name },
      data: { metric: message.metric, title: message.title, environment: rule.environment },
    });
    await this.dispatchService.sendToChannels(rule, message);
  }

  private measure(rule: RuleWithChannels, spec: MetricRuleSpec, now: number): Promise<number | null> {
    const windowMs = spec.windowMins * MINUTE_MS;
    return this.seriesRepository.total({
      projectId: rule.projectId,
      source: spec.source,
      name: spec.name ?? undefined,
      aggregation: spec.aggregation,
      from: new Date(now - windowMs),
      bucket: `${spec.windowMins} minutes`,
      bucketSeconds: windowMs / 1000,
      windowSeconds: windowMs / 1000,
      environment: rule.environment ?? undefined,
      tag: spec.tagKey && spec.tagValue ? { key: spec.tagKey, value: spec.tagValue } : undefined,
    });
  }

  private inCooldown(rule: RuleWithChannels, now: number): Promise<boolean> {
    const quietMs = Math.max(rule.cooldownMins, 1) * MINUTE_MS;
    return this.deliveryRepository.wasAttemptedSince(rule.id, new Date(now - quietMs));
  }

  private async runSafely(): Promise<void> {
    if (this.running) {
      return;
    }
    this.running = true;
    try {
      await this.evaluateAll();
    } catch (error) {
      this.logger.error(`Metric alert run failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      this.running = false;
    }
  }
}
