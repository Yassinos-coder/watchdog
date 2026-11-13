import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { RoleValidator } from '../../auth/validators/role.validator';
import type { User } from '../../generated/prisma/client';
import { ProjectRepository } from '../../projects/repositories/project.repository';
import { MAX_RULES_PER_PROJECT } from '../constants/alert.constants';
import { CreateRuleDto, UpdateRuleDto } from '../dto/alert.dto';
import { MetricRuleValidator } from '../validators/metric-rule.validator';
import { RuleView } from '../interfaces/alert.interfaces';
import { AlertChannelRepository } from '../repositories/alert-channel.repository';
import { AlertRuleRepository, RuleData, RuleWithChannels } from '../repositories/alert-rule.repository';

const DEFAULT_COOLDOWN_MINS = 30;
const DEFAULT_MIN_LEVEL = 'error';

@Injectable()
export class AlertRulesService {
  constructor(
    private readonly ruleRepository: AlertRuleRepository,
    private readonly channelRepository: AlertChannelRepository,
    private readonly projectRepository: ProjectRepository,
  ) {}

  async list(projectId: string): Promise<RuleView[]> {
    await this.requireProject(projectId);
    return (await this.ruleRepository.findByProject(projectId)).map((rule) => this.toView(rule));
  }

  async create(user: User, projectId: string, dto: CreateRuleDto): Promise<RuleView> {
    RoleValidator.assertAtLeast(user.role, 'ADMIN');
    await this.requireProject(projectId);
    if ((await this.ruleRepository.countByProject(projectId)) >= MAX_RULES_PER_PROJECT) {
      throw new BadRequestException(`A project can have at most ${MAX_RULES_PER_PROJECT} rules`);
    }
    await this.assertChannelsExist(dto.channelIds);
    const data = this.toData(dto);
    this.assertSettings(data);
    return this.toView(await this.ruleRepository.create(projectId, data, dto.channelIds));
  }

  async update(user: User, ruleId: string, dto: UpdateRuleDto): Promise<RuleView> {
    RoleValidator.assertAtLeast(user.role, 'ADMIN');
    const existing = await this.require(ruleId);
    if (dto.channelIds) {
      await this.assertChannelsExist(dto.channelIds);
    }
    const merged: RuleData = {
      name: dto.name?.trim() ?? existing.name,
      trigger: dto.trigger ?? existing.trigger,
      spikeThreshold: dto.spikeThreshold ?? existing.spikeThreshold,
      spikeWindowMins: dto.spikeWindowMins ?? existing.spikeWindowMins,
      metricSource: dto.metricSource ?? existing.metricSource,
      metricName: dto.metricName === undefined ? existing.metricName : dto.metricName.trim() || null,
      metricAggregation: dto.metricAggregation ?? existing.metricAggregation,
      metricComparator: dto.metricComparator ?? existing.metricComparator,
      metricThreshold: dto.metricThreshold ?? existing.metricThreshold,
      metricWindowMins: dto.metricWindowMins ?? existing.metricWindowMins,
      metricTagKey: dto.metricTagKey === undefined ? existing.metricTagKey : dto.metricTagKey.trim() || null,
      metricTagValue: dto.metricTagValue === undefined ? existing.metricTagValue : dto.metricTagValue.trim() || null,
      minLevel: dto.minLevel ?? existing.minLevel,
      environment: dto.environment === undefined ? existing.environment : dto.environment.trim() || null,
      cooldownMins: dto.cooldownMins ?? existing.cooldownMins,
      enabled: dto.enabled ?? existing.enabled,
    };
    const data = this.normalize(merged);
    this.assertSettings(data);
    return this.toView(await this.ruleRepository.update(ruleId, data, dto.channelIds));
  }

  async remove(user: User, ruleId: string): Promise<void> {
    RoleValidator.assertAtLeast(user.role, 'ADMIN');
    await this.require(ruleId);
    await this.ruleRepository.delete(ruleId);
  }

  private toData(dto: CreateRuleDto): RuleData {
    return this.normalize({
      name: dto.name.trim(),
      trigger: dto.trigger,
      spikeThreshold: dto.spikeThreshold ?? null,
      spikeWindowMins: dto.spikeWindowMins ?? null,
      metricSource: dto.metricSource ?? null,
      metricName: dto.metricName?.trim() || null,
      metricAggregation: dto.metricAggregation ?? null,
      metricComparator: dto.metricComparator ?? null,
      metricThreshold: dto.metricThreshold ?? null,
      metricWindowMins: dto.metricWindowMins ?? null,
      metricTagKey: dto.metricTagKey?.trim() || null,
      metricTagValue: dto.metricTagValue?.trim() || null,
      minLevel: dto.minLevel ?? DEFAULT_MIN_LEVEL,
      environment: dto.environment?.trim() || null,
      cooldownMins: dto.cooldownMins ?? DEFAULT_COOLDOWN_MINS,
      enabled: dto.enabled ?? true,
    });
  }

  private normalize(data: RuleData): RuleData {
    const isSpike = data.trigger === 'SPIKE';
    const isMetric = data.trigger === 'METRIC';
    return {
      ...data,
      spikeThreshold: isSpike ? data.spikeThreshold : null,
      spikeWindowMins: isSpike ? data.spikeWindowMins : null,
      metricSource: isMetric ? data.metricSource : null,
      metricName: isMetric ? data.metricName : null,
      metricAggregation: isMetric ? data.metricAggregation : null,
      metricComparator: isMetric ? data.metricComparator : null,
      metricThreshold: isMetric ? data.metricThreshold : null,
      metricWindowMins: isMetric ? data.metricWindowMins : null,
      metricTagKey: isMetric ? data.metricTagKey : null,
      metricTagValue: isMetric && data.metricTagKey ? data.metricTagValue : null,
    };
  }

  private assertSettings(data: RuleData): void {
    if (data.trigger === 'SPIKE' && (!data.spikeThreshold || !data.spikeWindowMins)) {
      throw new BadRequestException('Spike alerts need an event count and a time window');
    }
    if (data.trigger !== 'METRIC') {
      return;
    }
    if (!MetricRuleValidator.isComplete(data)) {
      throw new BadRequestException(
        'Metric alerts need a metric, an aggregation, a direction, a threshold and a time window',
      );
    }
    if (data.metricTagKey && !data.metricTagValue) {
      throw new BadRequestException('A tag filter needs both a key and a value');
    }
  }

  private async assertChannelsExist(channelIds: string[]): Promise<void> {
    const found = await this.channelRepository.findManyByIds(channelIds);
    if (found.length !== new Set(channelIds).size) {
      throw new BadRequestException('One or more channels no longer exist');
    }
  }

  private async require(ruleId: string): Promise<RuleWithChannels> {
    const rule = await this.ruleRepository.findById(ruleId);
    if (!rule) {
      throw new NotFoundException('Rule not found');
    }
    return rule;
  }

  private async requireProject(projectId: string): Promise<void> {
    if (!(await this.projectRepository.findById(projectId))) {
      throw new NotFoundException('Project not found');
    }
  }

  private toView(rule: RuleWithChannels): RuleView {
    return {
      id: rule.id,
      projectId: rule.projectId,
      name: rule.name,
      trigger: rule.trigger,
      spikeThreshold: rule.spikeThreshold,
      spikeWindowMins: rule.spikeWindowMins,
      metricSource: rule.metricSource,
      metricName: rule.metricName,
      metricAggregation: rule.metricAggregation,
      metricComparator: rule.metricComparator,
      metricThreshold: rule.metricThreshold,
      metricWindowMins: rule.metricWindowMins,
      metricTagKey: rule.metricTagKey,
      metricTagValue: rule.metricTagValue,
      minLevel: rule.minLevel,
      environment: rule.environment,
      cooldownMins: rule.cooldownMins,
      enabled: rule.enabled,
      channelIds: rule.channels.map((channel) => channel.id),
    };
  }
}
