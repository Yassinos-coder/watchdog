import { randomInt } from 'node:crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { MailService } from '../../mail/mail.service';
import { TokenUtils } from '../../shared/utils/token.utils';
import { EMAIL_OTP_LENGTH, EMAIL_OTP_TTL_MS } from '../constants/auth.constants';
import { AuthContext } from '../interfaces/auth.interfaces';
import { SessionRepository } from '../repositories/session.repository';

@Injectable()
export class EmailOtpService {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly mailService: MailService,
  ) {}

  async send({ session, user }: AuthContext): Promise<void> {
    if (!this.mailService.isConfigured()) {
      throw new BadRequestException('Email is not configured on this instance');
    }
    const code = this.createCode();
    await this.sessionRepository.setEmailOtp(
      session.id,
      TokenUtils.sha256(code),
      new Date(Date.now() + EMAIL_OTP_TTL_MS),
    );
    await this.mailService.sendLoginCode(user.email, code);
  }

  async verify({ session }: AuthContext, code: string): Promise<boolean> {
    if (!session.emailOtpHash || !session.emailOtpExpiresAt) {
      return false;
    }
    if (session.emailOtpExpiresAt.getTime() <= Date.now()) {
      return false;
    }
    if (!TokenUtils.safeEqual(TokenUtils.sha256(code.trim()), session.emailOtpHash)) {
      return false;
    }
    await this.sessionRepository.clearEmailOtp(session.id);
    return true;
  }

  private createCode(): string {
    return randomInt(0, 10 ** EMAIL_OTP_LENGTH)
      .toString()
      .padStart(EMAIL_OTP_LENGTH, '0');
  }
}
