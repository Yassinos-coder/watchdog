import { BaseApiClient } from '@/services/BaseApiClient';
import type {
  CreatedWebhook,
  Webhook,
  WebhookConfig,
  WebhookDelivery,
  WebhookInput,
} from '../types/webhook.types';

class WebhooksService extends BaseApiClient {
  getConfig(): Promise<WebhookConfig> {
    return this.get('/integrations/webhooks/config');
  }

  list(): Promise<Webhook[]> {
    return this.get('/integrations/webhooks');
  }

  deliveries(webhookId: string): Promise<WebhookDelivery[]> {
    return this.get(`/integrations/webhooks/${webhookId}/deliveries`);
  }

  create(input: WebhookInput): Promise<CreatedWebhook> {
    return this.post('/integrations/webhooks', input);
  }

  update(webhookId: string, input: Partial<WebhookInput> & { enabled?: boolean }): Promise<Webhook> {
    return this.patch(`/integrations/webhooks/${webhookId}`, input);
  }

  test(webhookId: string): Promise<WebhookDelivery> {
    return this.post(`/integrations/webhooks/${webhookId}/test`);
  }

  rotateSecret(webhookId: string): Promise<{ secret: string }> {
    return this.post(`/integrations/webhooks/${webhookId}/rotate-secret`);
  }

  remove(webhookId: string): Promise<void> {
    return this.delete(`/integrations/webhooks/${webhookId}`);
  }
}

export const webhooksService = new WebhooksService();
