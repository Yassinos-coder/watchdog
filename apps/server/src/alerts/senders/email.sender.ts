import { Injectable } from '@nestjs/common';
import { MailService } from '../../mail/mail.service';
import { AlertMessage, ChannelConfig, ChannelSender, EmailConfig } from '../interfaces/alert.interfaces';

@Injectable()
export class EmailSender implements ChannelSender {
  readonly type = 'EMAIL' as const;

  constructor(private readonly mailService: MailService) {}

  async send(config: ChannelConfig, message: AlertMessage): Promise<void> {
    const { recipients } = config as EmailConfig;
    await this.mailService.sendMail(recipients, `[${message.projectName}] ${message.title}`, this.body(message));
  }

  body(message: AlertMessage): string {
    if (message.notice) {
      return [message.reason, '', ...message.notice.lines, '', `Open Watchdog: ${message.issueUrl}`].join('\n');
    }
    return [
      message.reason,
      '',
      message.title,
      message.culprit ?? '',
      '',
      `Project: ${message.projectName}`,
      message.metric ? '' : `Level: ${message.level}`,
      message.environment ? `Environment: ${message.environment}` : '',
      message.release ? `Release: ${message.release}` : '',
      message.metric ? '' : `Events: ${message.eventCount}`,
      '',
      `${message.metric ? 'Open the dashboards' : 'Open the issue'}: ${message.issueUrl}`,
    ]
      .filter((line, index, lines) => line !== '' || lines[index - 1] !== '')
      .join('\n');
  }
}
