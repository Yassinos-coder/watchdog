import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { createTransport } from 'nodemailer';
import { SmtpSettingsService } from './services/smtp-settings.service';

const CONNECTION_TIMEOUT_MS = 10_000;

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly smtpSettings: SmtpSettingsService) {}

  async isConfigured(): Promise<boolean> {
    return (await this.smtpSettings.getEffective()) !== null;
  }

  sendLoginCode(to: string, code: string): Promise<void> {
    return this.sendMail(
      [to],
      'Your Watchdog sign-in code',
      `Your Watchdog sign-in code is ${code}. It expires in 10 minutes. If you did not try to sign in, change your password.`,
    );
  }

  async sendMail(to: string[], subject: string, text: string): Promise<void> {
    const settings = await this.smtpSettings.getEffective();
    if (!settings) {
      throw new ServiceUnavailableException('Email is not configured on this instance');
    }
    const transporter = createTransport({
      host: settings.host,
      port: settings.port,
      secure: settings.secure,
      auth: settings.user && settings.password ? { user: settings.user, pass: settings.password } : undefined,
      connectionTimeout: CONNECTION_TIMEOUT_MS,
      greetingTimeout: CONNECTION_TIMEOUT_MS,
      socketTimeout: CONNECTION_TIMEOUT_MS,
    });
    try {
      await transporter.sendMail({ from: settings.from, to, subject, text });
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Failed to send email';
      this.logger.error(detail);
      throw new ServiceUnavailableException(`Could not send email: ${detail}`);
    } finally {
      transporter.close();
    }
  }
}
