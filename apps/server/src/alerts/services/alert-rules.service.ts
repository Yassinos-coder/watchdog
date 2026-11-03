import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { RoleValidator } from '../../auth/validators/role.validator';
import type { User } from '../../generated/prisma/client';
import { ProjectRepository } from '../../projects/repositories/project.repository';
import { MAX_RULES_PER_PROJECT } from '../constants/alert.constants';
import { CreateRuleDto, UpdateRuleDto } from '../dto/alert.dto';
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
    this.assertSpikeSettings(data);
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
      minLevel: dto.minLevel ?? existing.minLevel,
      environment: dto.environment === undefined ? existing.environment : dto.environment.trim() || null,
      cooldownMins: dto.cooldownMins ?? existing.cooldownMins,
      enabled: dto.enabled ?? existing.enabled,
    };
    this.assertSpikeSettings(merged);
    return this.toView(await this.ruleRepository.update(ruleId, merged, dto.channelIds));
  }

  async remove(user: User, ruleId: string): Promise<void> {
    RoleValidator.assertAtLeast(user.role, 'ADMIN');
    await this.require(ruleId);
    await this.ruleRepository.delete(ruleId);
  }

  private toData(dto: CreateRuleDto): RuleData {
    return {
      name: dto.name.trim(),
      trigger: dto.trigger,
      spikeThreshold: dto.trigger === 'SPIKE' ? (dto.spikeThreshold ?? null) : null,
      spikeWindowMins: dto.trigger === 'SPIKE' ? (dto.spikeWindowMins ?? null) : null,
      minLevel: dto.minLevel ?? DEFAULT_MIN_LEVEL,
      environment: dto.environment?.trim() || null,
      cooldownMins: dto.cooldownMins ?? DEFAULT_COOLDOWN_MINS,
      enabled: dto.enabled ?? true,
    };
  }

  private assertSpikeSettings(data: RuleData): void {
    if (data.trigger === 'SPIKE' && (!data.spikeThreshold || !data.spikeWindowMins)) {
      throw new BadRequestException('Spike alerts need an event count and a time window');
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
      minLevel: rule.minLevel,
      environment: rule.environment,
      cooldownMins: rule.cooldownMins,
      enabled: rule.enabled,
      channelIds: rule.channels.map((channel) => channel.id),
    };
  }
}
