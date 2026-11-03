import { BaseApiClient } from '@/services/BaseApiClient';
import type {
  AlertChannel,
  AlertDelivery,
  AlertRule,
  CreateChannelInput,
  RuleInput,
  SaveSmtpInput,
  SmtpSettings,
} from '../types/alert.types';

class AlertsService extends BaseApiClient {
  listChannels(): Promise<AlertChannel[]> {
    return this.get('/alerts/channels');
  }

  listDeliveries(): Promise<AlertDelivery[]> {
    return this.get('/alerts/deliveries');
  }

  listRules(projectId: string): Promise<AlertRule[]> {
    return this.get(`/projects/${projectId}/alert-rules`);
  }

  getSmtp(): Promise<SmtpSettings> {
    return this.get('/settings/smtp');
  }

  createChannel(input: CreateChannelInput): Promise<AlertChannel> {
    return this.post('/alerts/channels', input);
  }

  testChannel(channelId: string): Promise<void> {
    return this.post(`/alerts/channels/${channelId}/test`);
  }

  createRule(projectId: string, input: RuleInput): Promise<AlertRule> {
    return this.post(`/projects/${projectId}/alert-rules`, input);
  }

  sendTestEmail(to: string): Promise<void> {
    return this.post('/settings/smtp/test', { to });
  }

  updateChannel(channelId: string, input: { name?: string; enabled?: boolean }): Promise<AlertChannel> {
    return this.patch(`/alerts/channels/${channelId}`, input);
  }

  updateRule(ruleId: string, input: Partial<RuleInput>): Promise<AlertRule> {
    return this.patch(`/alert-rules/${ruleId}`, input);
  }

  saveSmtp(input: SaveSmtpInput): Promise<SmtpSettings> {
    return this.put('/settings/smtp', input);
  }

  clearSmtp(): Promise<SmtpSettings> {
    return this.delete('/settings/smtp');
  }

  removeChannel(channelId: string): Promise<void> {
    return this.delete(`/alerts/channels/${channelId}`);
  }

  removeRule(ruleId: string): Promise<void> {
    return this.delete(`/alert-rules/${ruleId}`);
  }
}

export const alertsService = new AlertsService();
