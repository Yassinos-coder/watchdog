import type {
  AlertChannelType,
  AlertTrigger,
  MetricComparator,
  WidgetAggregation,
  WidgetSource,
} from '../../generated/prisma/enums';

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

export interface MetricRuleSpec {
  source: WidgetSource;
  name: string | null;
  aggregation: WidgetAggregation;
  comparator: MetricComparator;
  threshold: number;
  windowMins: number;
  tagKey: string | null;
  tagValue: string | null;
}

export interface MetricAlertDetail {
  source: WidgetSource;
  name: string;
  aggregation: WidgetAggregation;
  comparator: MetricComparator;
  threshold: number;
  value: number;
  windowMins: number;
}

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
  metric?: MetricAlertDetail;
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
  metricSource: WidgetSource | null;
  metricName: string | null;
  metricAggregation: WidgetAggregation | null;
  metricComparator: MetricComparator | null;
  metricThreshold: number | null;
  metricWindowMins: number | null;
  metricTagKey: string | null;
  metricTagValue: string | null;
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
