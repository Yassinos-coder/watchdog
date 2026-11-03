import { Hash, Mail, MessageCircle, Send, type LucideIcon } from 'lucide-react';
import type { AlertTrigger, ChannelType } from '../types/alert.types';

export interface ChannelMeta {
  label: string;
  icon: LucideIcon;
  docsPath: string;
}

export const CHANNEL_META: Record<ChannelType, ChannelMeta> = {
  SLACK: { label: 'Slack', icon: Hash, docsPath: 'alerts/slack#create-a-webhook' },
  DISCORD: { label: 'Discord', icon: MessageCircle, docsPath: 'alerts/discord#create-a-webhook' },
  TELEGRAM: { label: 'Telegram', icon: Send, docsPath: 'alerts/telegram#create-a-bot' },
  EMAIL: { label: 'Email', icon: Mail, docsPath: 'alerts/email#add-an-email-channel' },
};

export const CHANNEL_TYPES: ChannelType[] = ['SLACK', 'DISCORD', 'TELEGRAM', 'EMAIL'];

export const TRIGGER_LABEL: Record<AlertTrigger, string> = {
  NEW_ISSUE: 'A new issue appears',
  REGRESSION: 'A resolved issue comes back',
  SPIKE: 'An issue spikes',
};

export const LEVELS = [
  { value: 'debug', label: 'Debug and above' },
  { value: 'info', label: 'Info and above' },
  { value: 'warning', label: 'Warning and above' },
  { value: 'error', label: 'Errors and above' },
  { value: 'fatal', label: 'Fatal only' },
];

export const DEFAULT_COOLDOWN_MINS = 30;
