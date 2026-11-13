import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { AlertChannel, AlertRule } from '../../generated/prisma/client';
import type {
  AlertTrigger,
  MetricComparator,
  WidgetAggregation,
  WidgetSource,
} from '../../generated/prisma/enums';

export interface RuleWithChannels extends AlertRule {
  channels: AlertChannel[];
}

export interface RuleData {
  name: string;
  trigger: AlertTrigger;
  spikeThreshold: number | null;
  spikeWindowMins: number | null;
  metricSource: WidgetSource | null;
  metricName: string | null;
  metricAggregation: WidgetAggregation | null;
  metricComparator: MetricComparator | null;
  metricThreshold: number | null;
  metricWindowMins: number | null;
  metricTagKey: string | null;
  metricTagValue: string | null;
  minLevel: string;
  environment: string | null;
  cooldownMins: number;
  enabled: boolean;
}

const WITH_CHANNELS = { channels: true };

@Injectable()
export class AlertRuleRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByProject(projectId: string): Promise<RuleWithChannels[]> {
    return this.prisma.alertRule.findMany({
      where: { projectId },
      include: WITH_CHANNELS,
      orderBy: { createdAt: 'asc' },
    });
  }

  findById(id: string): Promise<RuleWithChannels | null> {
    return this.prisma.alertRule.findUnique({ where: { id }, include: WITH_CHANNELS });
  }

  findActive(projectId: string, trigger: AlertTrigger): Promise<RuleWithChannels[]> {
    return this.prisma.alertRule.findMany({
      where: { projectId, trigger, enabled: true },
      include: WITH_CHANNELS,
    });
  }

  findAllActive(trigger: AlertTrigger): Promise<RuleWithChannels[]> {
    return this.prisma.alertRule.findMany({
      where: { trigger, enabled: true },
      include: WITH_CHANNELS,
    });
  }

  countByProject(projectId: string): Promise<number> {
    return this.prisma.alertRule.count({ where: { projectId } });
  }

  create(projectId: string, data: RuleData, channelIds: string[]): Promise<RuleWithChannels> {
    return this.prisma.alertRule.create({
      data: { projectId, ...data, channels: { connect: channelIds.map((id) => ({ id })) } },
      include: WITH_CHANNELS,
    });
  }

  update(id: string, data: Partial<RuleData>, channelIds?: string[]): Promise<RuleWithChannels> {
    return this.prisma.alertRule.update({
      where: { id },
      data: { ...data, ...(channelIds ? { channels: { set: channelIds.map((channelId) => ({ id: channelId })) } } : {}) },
      include: WITH_CHANNELS,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.alertRule.delete({ where: { id } });
  }
}
