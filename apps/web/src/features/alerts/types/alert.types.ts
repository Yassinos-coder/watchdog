export type ChannelType = 'SLACK' | 'DISCORD' | 'TELEGRAM' | 'EMAIL';
export type AlertTrigger = 'NEW_ISSUE' | 'REGRESSION' | 'SPIKE' | 'METRIC';
export type MetricComparator = 'ABOVE' | 'BELOW';
export type MetricAlertSource = 'METRIC' | 'TRANSACTIONS';
export type MetricAlertAggregation =
  'AVG' | 'SUM' | 'MIN' | 'MAX' | 'COUNT' | 'P50' | 'P95' | 'P99' | 'RATE';

export interface MetricRuleFields {
  metricSource: MetricAlertSource | null;
  metricName: string | null;
  metricAggregation: MetricAlertAggregation | null;
  metricComparator: MetricComparator | null;
  metricThreshold: number | null;
  metricWindowMins: number | null;
  metricTagKey: string | null;
  metricTagValue: string | null;
}

export interface AlertChannel {
  id: string;
  type: ChannelType;
  name: string;
  hint: string;
  enabled: boolean;
  createdAt: string;
}

export interface AlertRule extends MetricRuleFields {
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

export interface AlertDelivery {
  id: string;
  status: 'SENT' | 'FAILED';
  error: string | null;
  ruleName: string | null;
  channelName: string | null;
  issueId: string | null;
  createdAt: string;
}

export interface SmtpSettings {
  configured: boolean;
  source: 'database' | 'environment' | 'none';
  host: string | null;
  port: number | null;
  secure: boolean | null;
  user: string | null;
  from: string | null;
  hasPassword: boolean;
}

export interface SaveSmtpInput {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  password?: string;
  from: string;
}

export interface CreateChannelInput {
  type: ChannelType;
  name: string;
  config: Record<string, unknown>;
}

export interface RuleInput {
  name: string;
  trigger: AlertTrigger;
  spikeThreshold?: number;
  spikeWindowMins?: number;
  metricSource?: MetricAlertSource;
  metricName?: string;
  metricAggregation?: MetricAlertAggregation;
  metricComparator?: MetricComparator;
  metricThreshold?: number;
  metricWindowMins?: number;
  metricTagKey?: string;
  metricTagValue?: string;
  minLevel: string;
  environment?: string;
  cooldownMins: number;
  enabled: boolean;
  channelIds: string[];
}
