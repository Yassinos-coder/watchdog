import type { Webhook, WebhookDelivery } from '../../generated/prisma/client';
import { WebhookDeliveryView, WebhookView } from '../interfaces/webhook.interfaces';

export class WebhookMapper {
  static toView(webhook: Webhook): WebhookView {
    return {
      id: webhook.id,
      name: webhook.name,
      url: webhook.url,
      events: webhook.events,
      enabled: webhook.enabled,
      createdAt: webhook.createdAt,
    };
  }

  static toDeliveryView(delivery: Omit<WebhookDelivery, 'webhookId'> & { webhookId?: string }): WebhookDeliveryView {
    return {
      id: delivery.id,
      event: delivery.event,
      status: delivery.status,
      responseCode: delivery.responseCode,
      error: delivery.error,
      createdAt: delivery.createdAt,
    };
  }
}
