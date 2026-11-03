import { BadRequestException } from '@nestjs/common';
import type { AlertChannelType } from '../../generated/prisma/enums';
import {
  MAX_EMAIL_RECIPIENTS,
  TELEGRAM_CHAT_PATTERN,
  TELEGRAM_TOKEN_PATTERN,
  WEBHOOK_HOSTS,
} from '../constants/alert.constants';
import { ChannelConfig } from '../interfaces/alert.interfaces';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class ChannelConfigValidator {
  static parse(type: AlertChannelType, raw: Record<string, unknown>): ChannelConfig {
    switch (type) {
      case 'SLACK':
        return { webhookUrl: ChannelConfigValidator.webhook(raw.webhookUrl, 'Slack', WEBHOOK_HOSTS.SLACK) };
      case 'DISCORD':
        return {
          webhookUrl: ChannelConfigValidator.webhook(raw.webhookUrl, 'Discord', WEBHOOK_HOSTS.DISCORD),
        };
      case 'TELEGRAM':
        return ChannelConfigValidator.telegram(raw);
      case 'EMAIL':
        return ChannelConfigValidator.email(raw);
    }
  }

  static hint(type: AlertChannelType, config: ChannelConfig): string {
    if ('webhookUrl' in config) {
      return `${new URL(config.webhookUrl).host}/…${config.webhookUrl.slice(-4)}`;
    }
    if ('chatId' in config) {
      return `Chat ${config.chatId}`;
    }
    return type === 'EMAIL' && 'recipients' in config ? config.recipients.join(', ') : '';
  }

  private static webhook(value: unknown, label: string, hosts: readonly string[]): string {
    if (typeof value !== 'string') {
      throw new BadRequestException(`${label} webhook URL is required`);
    }
    let url: URL;
    try {
      url = new URL(value.trim());
    } catch {
      throw new BadRequestException(`${label} webhook URL is not a valid URL`);
    }
    if (url.protocol !== 'https:' || !hosts.includes(url.hostname) || url.username || url.password) {
      throw new BadRequestException(
        `${label} webhook URL must be an https URL on ${hosts.join(' or ')}`,
      );
    }
    return url.toString();
  }

  private static telegram(raw: Record<string, unknown>): ChannelConfig {
    const botToken = typeof raw.botToken === 'string' ? raw.botToken.trim() : '';
    const chatId = typeof raw.chatId === 'string' ? raw.chatId.trim() : String(raw.chatId ?? '').trim();
    if (!TELEGRAM_TOKEN_PATTERN.test(botToken)) {
      throw new BadRequestException('Telegram bot token looks wrong. Copy it from @BotFather');
    }
    if (!TELEGRAM_CHAT_PATTERN.test(chatId)) {
      throw new BadRequestException('Telegram chat ID must be a number or an @channelname');
    }
    return { botToken, chatId };
  }

  private static email(raw: Record<string, unknown>): ChannelConfig {
    const recipients = Array.isArray(raw.recipients)
      ? raw.recipients.filter((entry): entry is string => typeof entry === 'string').map((entry) => entry.trim())
      : [];
    if (recipients.length === 0 || recipients.length > MAX_EMAIL_RECIPIENTS) {
      throw new BadRequestException(`Add between 1 and ${MAX_EMAIL_RECIPIENTS} email addresses`);
    }
    const invalid = recipients.find((entry) => !EMAIL_PATTERN.test(entry));
    if (invalid) {
      throw new BadRequestException(`"${invalid}" is not a valid email address`);
    }
    return { recipients: [...new Set(recipients.map((entry) => entry.toLowerCase()))] };
  }
}
