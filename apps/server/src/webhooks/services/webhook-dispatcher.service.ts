import { randomUUID } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Webhook } from '../../generated/prisma/client';
import { SecretCipher } from '../../shared/utils/secret-cipher.utils';
import {
  DELIVERY_HEADER,
  EVENT_HEADER,
  MAX_ERROR_LENGTH,
  MAX_WEBHOOK_ATTEMPTS,
  SIGNATURE_HEADER,
  WEBHOOK_RETRY_DELAY_MS,
} from '../constants/webhook.constants';
import { WebhookDeliveryView, WebhookEnvelope } from '../interfaces/webhook.interfaces';
import { WebhookMapper } from '../mappers/webhook.mapper';
import { WebhookRepository } from '../repositories/webhook.repository';
import { WebhookSignatureUtils } from '../utils/webhook-signature.utils';
import { WebhookUrlValidator } from '../validators/webhook-url.validator';
import { WebhookSender } from './webhook-sender.service';

interface Attempt {
  ok: boolean;
  retry: boolean;
  responseCode?: number;
  error?: string;
}

@Injectable()
export class WebhookDispatcher {
  private readonly logger = new Logger(WebhookDispatcher.name);

  constructor(
    private readonly webhookRepository: WebhookRepository,
    private readonly sender: WebhookSender,
    private readonly configService: ConfigService,
  ) {}

  async emit(type: string, data: unknown): Promise<void> {
    try {
      const webhooks = await this.webhookRepository.findSubscribed(type);
      const envelope = this.envelope(type, data);
      await Promise.all(webhooks.map((webhook) => this.deliver(webhook, envelope)));
    } catch (error) {
      this.logger.error(`Could not send ${type} webhooks: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  envelope(type: string, data: unknown): WebhookEnvelope {
    return { id: randomUUID(), type, createdAt: new Date().toISOString(), data };
  }

  async deliver(webhook: Webhook, envelope: WebhookEnvelope): Promise<WebhookDeliveryView> {
    const body = JSON.stringify(envelope);
    const secret = SecretCipher.decrypt(webhook.secretEnc, this.configService.getOrThrow<string>('security.secretKey'));
    let attempt: Attempt = { ok: false, retry: false };
    for (let number = 1; number <= MAX_WEBHOOK_ATTEMPTS; number += 1) {
      attempt = await this.attempt(webhook, envelope, body, secret);
      if (attempt.ok || !attempt.retry || number === MAX_WEBHOOK_ATTEMPTS) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, WEBHOOK_RETRY_DELAY_MS));
    }
    const input = {
      webhookId: webhook.id,
      event: envelope.type,
      status: attempt.ok ? ('SENT' as const) : ('FAILED' as const),
      responseCode: attempt.responseCode,
      error: attempt.error,
    };
    await this.webhookRepository.recordDelivery(input).catch(() => undefined);
    return WebhookMapper.toDeliveryView({ ...input, id: envelope.id, responseCode: input.responseCode ?? null, error: input.error ?? null, createdAt: new Date() });
  }

  private async attempt(webhook: Webhook, envelope: WebhookEnvelope, body: string, secret: string): Promise<Attempt> {
    try {
      await WebhookUrlValidator.assertPublic(WebhookUrlValidator.parse(webhook.url));
      const timestamp = Math.floor(Date.now() / 1000);
      const status = await this.sender.post(
        webhook.url,
        {
          [SIGNATURE_HEADER]: WebhookSignatureUtils.sign(secret, timestamp, body),
          [EVENT_HEADER]: envelope.type,
          [DELIVERY_HEADER]: envelope.id,
        },
        body,
      );
      const ok = status >= 200 && status < 300;
      return {
        ok,
        retry: status >= 500 || status === 429,
        responseCode: status,
        error: ok ? undefined : `Your endpoint answered ${status}`,
      };
    } catch (error) {
      const detail = (error instanceof Error ? error.message : 'Unknown error').slice(0, MAX_ERROR_LENGTH);
      return { ok: false, retry: true, error: detail };
    }
  }
}
