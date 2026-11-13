import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { Webhook, WebhookDelivery } from '../../generated/prisma/client';
import { DELIVERY_KEEP_DAYS, DELIVERY_LIST_LIMIT } from '../constants/webhook.constants';

interface WebhookData {
  name: string;
  url: string;
  events: string[];
  enabled?: boolean;
}

interface RecordDeliveryInput {
  webhookId: string;
  event: string;
  status: 'SENT' | 'FAILED';
  responseCode?: number;
  error?: string;
}

const DAY_MS = 86_400_000;

@Injectable()
export class WebhookRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Webhook[]> {
    return this.prisma.webhook.findMany({ orderBy: { createdAt: 'asc' } });
  }

  findById(id: string): Promise<Webhook | null> {
    return this.prisma.webhook.findUnique({ where: { id } });
  }

  findSubscribed(event: string): Promise<Webhook[]> {
    return this.prisma.webhook.findMany({ where: { enabled: true, events: { has: event } } });
  }

  count(): Promise<number> {
    return this.prisma.webhook.count();
  }

  create(data: WebhookData & { secretEnc: string }): Promise<Webhook> {
    return this.prisma.webhook.create({ data });
  }

  update(id: string, data: Partial<WebhookData> & { secretEnc?: string }): Promise<Webhook> {
    return this.prisma.webhook.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.webhook.delete({ where: { id } });
  }

  listDeliveries(webhookId: string): Promise<WebhookDelivery[]> {
    return this.prisma.webhookDelivery.findMany({
      where: { webhookId },
      orderBy: { createdAt: 'desc' },
      take: DELIVERY_LIST_LIMIT,
    });
  }

  async recordDelivery(input: RecordDeliveryInput, now = Date.now()): Promise<void> {
    await this.prisma.webhookDelivery.create({ data: input });
    await this.prisma.webhookDelivery.deleteMany({
      where: { webhookId: input.webhookId, createdAt: { lt: new Date(now - DELIVERY_KEEP_DAYS * DAY_MS) } },
    });
  }
}
