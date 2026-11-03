import { Injectable } from '@nestjs/common';
import { AlertMessage, ChannelConfig, ChannelSender, WebhookConfig } from '../interfaces/alert.interfaces';
import { HttpPoster } from '../services/http-poster.service';

@Injectable()
export class SlackSender implements ChannelSender {
  readonly type = 'SLACK' as const;

  constructor(private readonly http: HttpPoster) {}

  send(config: ChannelConfig, message: AlertMessage): Promise<void> {
    return this.http.postJson((config as WebhookConfig).webhookUrl, this.payload(message));
  }

  payload(message: AlertMessage): Record<string, unknown> {
    const details = [
      message.projectName,
      message.level,
      message.environment,
      message.release,
      `${message.eventCount} ${message.eventCount === 1 ? 'event' : 'events'}`,
    ].filter(Boolean);
    return {
      text: `${message.reason}: ${message.title}`,
      blocks: [
        { type: 'section', text: { type: 'mrkdwn', text: `*${this.escape(message.reason)}*\n<${message.issueUrl}|${this.escape(message.title)}>` } },
        ...(message.culprit ? [{ type: 'section', text: { type: 'mrkdwn', text: `\`${this.escape(message.culprit)}\`` } }] : []),
        { type: 'context', elements: [{ type: 'mrkdwn', text: details.map((part) => this.escape(String(part))).join('  •  ') }] },
      ],
    };
  }

  private escape(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
