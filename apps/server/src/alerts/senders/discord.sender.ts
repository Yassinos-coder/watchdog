import { Injectable } from '@nestjs/common';
import { AlertMessage, ChannelConfig, ChannelSender, WebhookConfig } from '../interfaces/alert.interfaces';
import { HttpPoster } from '../services/http-poster.service';

const COLORS: Record<string, number> = {
  fatal: 0xf05a5a,
  error: 0xf05a5a,
  warning: 0xf0b429,
  info: 0x3fb5c0,
  debug: 0x8fa9af,
};
const MAX_TITLE = 250;
const MAX_FIELD = 1000;

@Injectable()
export class DiscordSender implements ChannelSender {
  readonly type = 'DISCORD' as const;

  constructor(private readonly http: HttpPoster) {}

  send(config: ChannelConfig, message: AlertMessage): Promise<void> {
    return this.http.postJson((config as WebhookConfig).webhookUrl, this.payload(message));
  }

  payload(message: AlertMessage): Record<string, unknown> {
    const fields = [
      { name: 'Project', value: message.projectName, inline: true },
      { name: 'Level', value: message.level, inline: true },
      ...(message.environment ? [{ name: 'Environment', value: message.environment, inline: true }] : []),
      ...(message.release ? [{ name: 'Release', value: message.release, inline: true }] : []),
      { name: 'Events', value: String(message.eventCount), inline: true },
    ];
    return {
      allowed_mentions: { parse: [] },
      embeds: [
        {
          title: message.title.slice(0, MAX_TITLE),
          url: message.issueUrl,
          description: message.culprit ? `\`${message.culprit.slice(0, MAX_FIELD)}\`` : undefined,
          author: { name: message.reason },
          color: COLORS[message.level] ?? COLORS.error,
          fields,
        },
      ],
    };
  }
}
