export const ISSUE_EVENT_RECORDED = 'issue.event';

export const SMTP_SETTING_KEY = 'smtp';

export const WEBHOOK_TIMEOUT_MS = 8_000;
export const MAX_CHANNELS = 50;
export const MAX_RULES_PER_PROJECT = 50;
export const MAX_EMAIL_RECIPIENTS = 10;
export const DELIVERY_LIST_LIMIT = 50;
export const MAX_ERROR_LENGTH = 300;
export const SPIKE_COUNTER_LIMIT = 5_000;
export const MINUTE_MS = 60_000;

export const ALERT_TRIGGERS = ['NEW_ISSUE', 'REGRESSION', 'SPIKE', 'METRIC'] as const;
export const METRIC_AGGREGATIONS = ['AVG', 'SUM', 'MIN', 'MAX', 'COUNT', 'P50', 'P95', 'P99', 'RATE'] as const;
export const METRIC_EVALUATION_INTERVAL_MS = MINUTE_MS;
export const METRIC_EVALUATION_STARTUP_DELAY_MS = 45_000;

export const LEVEL_RANK: Record<string, number> = {
  debug: 0,
  info: 1,
  warning: 2,
  error: 3,
  fatal: 4,
};

export const WEBHOOK_HOSTS = {
  SLACK: ['hooks.slack.com'],
  DISCORD: ['discord.com', 'discordapp.com', 'canary.discord.com', 'ptb.discord.com'],
} as const;

export const TELEGRAM_API_HOST = 'api.telegram.org';
export const TELEGRAM_TOKEN_PATTERN = /^\d{5,}:[\w-]{20,}$/;
export const TELEGRAM_CHAT_PATTERN = /^(@[A-Za-z][\w]{3,}|-?\d{3,})$/;
