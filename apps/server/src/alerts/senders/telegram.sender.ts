import { Injectable } from '@nestjs/common';
import { TELEGRAM_API_HOST } from '../constants/alert.constants';
import { AlertMessage, ChannelConfig, ChannelSender, TelegramConfig } from '../interfaces/alert.interfaces';
import { HttpPoster } from '../services/http-poster.service';

@Injectable()
export class TelegramSender implements ChannelSender {
  readonly type = 'TELEGRAM' as const;

  constructor(private readonly http: HttpPoster) {}

  send(config: ChannelConfig, message: AlertMessage): Promise<void> {
    const { botToken, chatId } = config as TelegramConfig;
    return this.http.postJson(`https://${TELEGRAM_API_HOST}/bot${botToken}/sendMessage`, {
      chat_id: chatId,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      text: this.text(message),
    });
  }

  text(message: AlertMessage): string {
    const details = [message.projectName, message.level, message.environment, message.release]
      .filter(Boolean)
      .map((part) => this.escape(String(part)))
      .join(' · ');
    return [
      `<b>${this.escape(message.reason)}</b>`,
      `<a href="${this.escape(message.issueUrl)}">${this.escape(message.title)}</a>`,
      message.culprit ? `<code>${this.escape(message.culprit)}</code>` : null,
      `${details} · ${message.eventCount} ${message.eventCount === 1 ? 'event' : 'events'}`,
    ]
      .filter(Boolean)
      .join('\n');
  }

  private escape(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}
