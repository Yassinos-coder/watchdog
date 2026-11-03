import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string | undefined;

  constructor(configService: ConfigService) {
    const host = configService.get<string | undefined>('mail.host');
    this.from = configService.get<string | undefined>('mail.from');
    if (!host) {
      this.transporter = null;
      return;
    }
    const user = configService.get<string | undefined>('mail.user');
    const password = configService.get<string | undefined>('mail.password');
    this.transporter = createTransport({
      host,
      port: configService.getOrThrow<number>('mail.port'),
      secure: configService.getOrThrow<boolean>('mail.secure'),
      auth: user && password ? { user, pass: password } : undefined,
    });
  }

  isConfigured(): boolean {
    return this.transporter !== null && Boolean(this.from);
  }

  async sendLoginCode(to: string, code: string): Promise<void> {
    await this.send(
      to,
      'Your Watchdog sign-in code',
      `Your Watchdog sign-in code is ${code}. It expires in 10 minutes. If you did not try to sign in, change your password.`,
    );
  }

  private async send(to: string, subject: string, text: string): Promise<void> {
    if (!this.transporter || !this.from) {
      throw new ServiceUnavailableException('Email is not configured on this instance');
    }
    try {
      await this.transporter.sendMail({ from: this.from, to, subject, text });
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : 'Failed to send email');
      throw new ServiceUnavailableException('Could not send email');
    }
  }
}
