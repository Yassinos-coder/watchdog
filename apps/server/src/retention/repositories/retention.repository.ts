import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class RetentionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async deleteIssuesBefore(cutoff: Date): Promise<number> {
    const result = await this.prisma.issue.deleteMany({ where: { lastSeen: { lt: cutoff } } });
    return result.count;
  }

  async deleteEventsBefore(cutoff: Date): Promise<number> {
    const result = await this.prisma.event.deleteMany({ where: { timestamp: { lt: cutoff } } });
    return result.count;
  }

  async deleteTransactionsBefore(cutoff: Date): Promise<number> {
    const result = await this.prisma.transaction.deleteMany({ where: { timestamp: { lt: cutoff } } });
    return result.count;
  }

  async deleteMetricsBefore(cutoff: Date): Promise<number> {
    const result = await this.prisma.metric.deleteMany({ where: { timestamp: { lt: cutoff } } });
    return result.count;
  }

  async deleteRollupsBefore(cutoff: Date): Promise<number> {
    const result = await this.prisma.metricRollup.deleteMany({ where: { bucket: { lt: cutoff } } });
    return result.count;
  }

  async deleteReplaysBefore(cutoff: Date): Promise<number> {
    const result = await this.prisma.replay.deleteMany({ where: { lastEventAt: { lt: cutoff } } });
    return result.count;
  }
}
