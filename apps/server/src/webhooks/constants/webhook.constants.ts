export const MAX_WEBHOOKS = 20;
export const WEBHOOK_TIMEOUT_MS = 8_000;
export const WEBHOOK_RETRY_DELAY_MS = 1_000;
export const MAX_WEBHOOK_ATTEMPTS = 2;
export const WEBHOOK_SECRET_PREFIX = 'whsec_';
export const SIGNATURE_HEADER = 'x-watchdog-signature';
export const EVENT_HEADER = 'x-watchdog-event';
export const DELIVERY_HEADER = 'x-watchdog-delivery';
export const DELIVERY_LIST_LIMIT = 20;
export const DELIVERY_KEEP_DAYS = 30;
export const MAX_ERROR_LENGTH = 300;

export interface WebhookEventDefinition {
  id: string;
  label: string;
  description: string;
}

export const WEBHOOK_EVENTS: WebhookEventDefinition[] = [
  { id: 'issue.new', label: 'New issue', description: 'An error is seen for the first time.' },
  { id: 'issue.regression', label: 'Issue regressed', description: 'An issue you resolved happens again.' },
  { id: 'issue.spike', label: 'Issue spike', description: 'An issue reaches the count of an alert rule within its window.' },
  { id: 'metric.alert', label: 'Metric alert', description: 'A metric or timing crosses the threshold of an alert rule.' },
  { id: 'watchdog.restarting', label: 'Watchdog restarting', description: 'Watchdog is about to stop for an update or restart.' },
  { id: 'watchdog.online', label: 'Watchdog online', description: 'Watchdog is back, with the state of each watched app.' },
];

export const WEBHOOK_EVENT_IDS = WEBHOOK_EVENTS.map((event) => event.id);
