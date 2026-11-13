export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  enabled: boolean;
  createdAt: string;
}

export interface CreatedWebhook extends Webhook {
  secret: string;
}

export interface WebhookDelivery {
  id: string;
  event: string;
  status: 'SENT' | 'FAILED';
  responseCode: number | null;
  error: string | null;
  createdAt: string;
}

export interface WebhookEventInfo {
  id: string;
  label: string;
  description: string;
}

export interface WebhookConfig {
  events: WebhookEventInfo[];
}

export interface WebhookInput {
  name: string;
  url: string;
  events: string[];
}
