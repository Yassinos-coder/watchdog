import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { Issue, Project } from '../../generated/prisma/client';
import { DELIVERY_LIST_LIMIT } from '../constants/alert.constants';
import { DeliveryView } from '../interfaces/alert.interfaces';

interface RecordDeliveryInput {
  ruleId: string;
  channelId: string;
  issueId?: string;
  status: 'SENT' | 'FAILED';
  error?: string;
}

export interface IssueWithProject extends Issue {
  project: Project;
}

@Injectable()
export class AlertDeliveryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: RecordDeliveryInput): Promise<void> {
    await this.prisma.alertDelivery.create({ data: input });
  }

  async wasSentSince(ruleId: string, issueId: string, since: Date): Promise<boolean> {
    const count = await this.prisma.alertDelivery.count({
      where: { ruleId, issueId, status: 'SENT', createdAt: { gte: since } },
    });
    return count > 0;
  }

  async wasAttemptedSince(ruleId: string, since: Date): Promise<boolean> {
    const count = await this.prisma.alertDelivery.count({ where: { ruleId, createdAt: { gte: since } } });
    return count > 0;
  }

  async listRecent(): Promise<DeliveryView[]> {
    const deliveries = await this.prisma.alertDelivery.findMany({
      orderBy: { createdAt: 'desc' },
      take: DELIVERY_LIST_LIMIT,
      include: { rule: { select: { name: true } }, channel: { select: { name: true } } },
    });
    return deliveries.map((delivery) => ({
      id: delivery.id,
      status: delivery.status,
      error: delivery.error,
      ruleName: delivery.rule?.name ?? null,
      channelName: delivery.channel?.name ?? null,
      issueId: delivery.issueId,
      createdAt: delivery.createdAt,
    }));
  }

  findIssueWithProject(issueId: string): Promise<IssueWithProject | null> {
    return this.prisma.issue.findUnique({ where: { id: issueId }, include: { project: true } });
  }
}
