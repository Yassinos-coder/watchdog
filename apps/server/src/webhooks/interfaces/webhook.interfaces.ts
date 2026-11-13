export interface WebhookView {
  id: string;
  name: string;
  url: string;
  events: string[];
  enabled: boolean;
  createdAt: Date;
}

export interface CreatedWebhookView extends WebhookView {
  secret: string;
}

export interface WebhookDeliveryView {
  id: string;
  event: string;
  status: 'SENT' | 'FAILED';
  responseCode: number | null;
  error: string | null;
  createdAt: Date;
}

export interface WebhookConfigView {
  events: { id: string; label: string; description: string }[];
}

export interface WebhookEnvelope {
  id: string;
  type: string;
  createdAt: string;
  data: unknown;
}

export interface AlertTriggeredSignal {
  type: 'issue.spike' | 'metric.alert';
  projectId: string;
  rule: { id: string; name: string };
  data: Record<string, unknown>;
}
