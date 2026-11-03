import type { AlertChannelType, AlertTrigger } from '../../generated/prisma/enums';

export interface WebhookConfig {
  webhookUrl: string;
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
}

export interface EmailConfig {
  recipients: string[];
}

export type ChannelConfig = WebhookConfig | TelegramConfig | EmailConfig;

export interface AlertMessage {
  trigger: AlertTrigger;
  reason: string;
  title: string;
  culprit: string | null;
  projectName: string;
  level: string;
  environment: string | null;
  release: string | null;
  eventCount: number;
  issueUrl: string;
}

export interface ChannelSender {
  readonly type: AlertChannelType;
  send(config: ChannelConfig, message: AlertMessage): Promise<void>;
}

export interface ChannelView {
  id: string;
  type: AlertChannelType;
  name: string;
  hint: string;
  enabled: boolean;
  createdAt: Date;
}

export interface RuleView {
  id: string;
  projectId: string;
  name: string;
  trigger: AlertTrigger;
  spikeThreshold: number | null;
  spikeWindowMins: number | null;
  minLevel: string;
  environment: string | null;
  cooldownMins: number;
  enabled: boolean;
  channelIds: string[];
}

export interface DeliveryView {
  id: string;
  status: 'SENT' | 'FAILED';
  error: string | null;
  ruleName: string | null;
  channelName: string | null;
  issueId: string | null;
  createdAt: Date;
}

export interface IssueSignal {
  projectId: string;
  issueId: string;
  isNewIssue: boolean;
  isRegression: boolean;
  level: string;
  environment: string | null;
  release: string | null;
}

export interface SmtpSettings {
  host: string;
  port: number;
  secure: boolean;
  user: string | null;
  password: string | null;
  from: string;
}

export interface SmtpSettingsView {
  configured: boolean;
  source: 'database' | 'environment' | 'none';
  host: string | null;
  port: number | null;
  secure: boolean | null;
  user: string | null;
  from: string | null;
  hasPassword: boolean;
}
