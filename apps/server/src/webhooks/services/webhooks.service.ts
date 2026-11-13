import { randomBytes } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RoleValidator } from '../../auth/validators/role.validator';
import type { User, Webhook } from '../../generated/prisma/client';
import { SecretCipher } from '../../shared/utils/secret-cipher.utils';
import { MAX_WEBHOOKS, WEBHOOK_EVENTS, WEBHOOK_SECRET_PREFIX } from '../constants/webhook.constants';
import { CreateWebhookDto, UpdateWebhookDto } from '../dto/webhook.dto';
import {
  CreatedWebhookView,
  WebhookConfigView,
  WebhookDeliveryView,
  WebhookView,
} from '../interfaces/webhook.interfaces';
import { WebhookMapper } from '../mappers/webhook.mapper';
import { WebhookRepository } from '../repositories/webhook.repository';
import { WebhookUrlValidator } from '../validators/webhook-url.validator';
import { WebhookDispatcher } from './webhook-dispatcher.service';

@Injectable()
export class WebhooksService {
  constructor(
    private readonly webhookRepository: WebhookRepository,
    private readonly dispatcher: WebhookDispatcher,
    private readonly configService: ConfigService,
  ) {}

  getConfig(): WebhookConfigView {
    return { events: WEBHOOK_EVENTS };
  }

  async list(): Promise<WebhookView[]> {
    return (await this.webhookRepository.findAll()).map(WebhookMapper.toView);
  }

  async deliveries(id: string): Promise<WebhookDeliveryView[]> {
    await this.require(id);
    return (await this.webhookRepository.listDeliveries(id)).map(WebhookMapper.toDeliveryView);
  }

  async create(user: User, dto: CreateWebhookDto): Promise<CreatedWebhookView> {
    RoleValidator.assertAtLeast(user.role, 'ADMIN');
    if ((await this.webhookRepository.count()) >= MAX_WEBHOOKS) {
      throw new BadRequestException(`You can have at most ${MAX_WEBHOOKS} webhooks`);
    }
    const url = await this.validUrl(dto.url);
    const secret = this.createSecret();
    const created = await this.webhookRepository.create({
      name: dto.name.trim(),
      url,
      events: dto.events,
      secretEnc: this.encrypt(secret),
    });
    return { ...WebhookMapper.toView(created), secret };
  }

  async update(user: User, id: string, dto: UpdateWebhookDto): Promise<WebhookView> {
    RoleValidator.assertAtLeast(user.role, 'ADMIN');
    await this.require(id);
    const updated = await this.webhookRepository.update(id, {
      name: dto.name?.trim(),
      url: dto.url === undefined ? undefined : await this.validUrl(dto.url),
      events: dto.events,
      enabled: dto.enabled,
    });
    return WebhookMapper.toView(updated);
  }

  async rotateSecret(user: User, id: string): Promise<{ secret: string }> {
    RoleValidator.assertAtLeast(user.role, 'ADMIN');
    await this.require(id);
    const secret = this.createSecret();
    await this.webhookRepository.update(id, { secretEnc: this.encrypt(secret) });
    return { secret };
  }

  async sendTest(user: User, id: string): Promise<WebhookDeliveryView> {
    RoleValidator.assertAtLeast(user.role, 'ADMIN');
    const webhook = await this.require(id);
    return this.dispatcher.deliver(
      webhook,
      this.dispatcher.envelope('webhook.test', { message: 'This is a test delivery from Watchdog.' }),
    );
  }

  async remove(user: User, id: string): Promise<void> {
    RoleValidator.assertAtLeast(user.role, 'ADMIN');
    await this.require(id);
    await this.webhookRepository.delete(id);
  }

  private async validUrl(value: string): Promise<string> {
    const url = WebhookUrlValidator.parse(value);
    await WebhookUrlValidator.assertPublic(url);
    return url.toString();
  }

  private async require(id: string): Promise<Webhook> {
    const webhook = await this.webhookRepository.findById(id);
    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }
    return webhook;
  }

  private createSecret(): string {
    return `${WEBHOOK_SECRET_PREFIX}${randomBytes(24).toString('base64url')}`;
  }

  private encrypt(secret: string): string {
    return SecretCipher.encrypt(secret, this.configService.getOrThrow<string>('security.secretKey'));
  }
}
