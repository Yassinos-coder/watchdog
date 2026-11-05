import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/server';
import type { MfaMethod } from '../../generated/prisma/enums';
import { UserRepository } from '../../users/repositories/user.repository';
import { MAX_MFA_ATTEMPTS } from '../constants/auth.constants';
import { VerifyMfaDto } from '../dto/auth.dto';
import {
  AuthContext,
  AuthOutcome,
  EnrollmentResult,
  TotpEnrollment,
} from '../interfaces/auth.interfaces';
import { AuthUserMapper } from '../mappers/auth-user.mapper';
import { SessionRepository } from '../repositories/session.repository';
import { EmailOtpService } from './email-otp.service';
import { PasskeyService } from './passkey.service';
import { RecoveryCodeService } from './recovery-code.service';
import { SessionService } from './session.service';
import { TotpService } from './totp.service';

@Injectable()
export class MfaService {
  constructor(
    private readonly totpService: TotpService,
    private readonly emailOtpService: EmailOtpService,
    private readonly passkeyService: PasskeyService,
    private readonly recoveryCodeService: RecoveryCodeService,
    private readonly sessionService: SessionService,
    private readonly sessionRepository: SessionRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async verifyLogin(context: AuthContext, dto: VerifyMfaDto): Promise<AuthOutcome> {
    this.assertPending(context);
    const accepted = await this.checkCode(context, dto);
    if (!accepted) {
      await this.rejectAttempt(context);
    }
    return this.completeLogin(context);
  }

  async sendEmailCode(context: AuthContext): Promise<void> {
    if (context.session.mfaPassed === false && !context.user.mfaMethods.includes('EMAIL')) {
      throw new BadRequestException('Email codes are not enabled for this account');
    }
    await this.emailOtpService.send(context);
  }

  async beginTotpEnrollment(context: AuthContext): Promise<TotpEnrollment> {
    this.assertFull(context);
    return this.totpService.beginEnrollment(context.user);
  }

  async confirmTotpEnrollment(context: AuthContext, code: string): Promise<EnrollmentResult> {
    this.assertFull(context);
    await this.totpService.confirmEnrollment(context.user, code);
    return this.finishEnrollment(context);
  }

  async confirmEmailEnrollment(context: AuthContext, code: string): Promise<EnrollmentResult> {
    this.assertFull(context);
    if (!(await this.emailOtpService.verify(context, code))) {
      throw new BadRequestException('Invalid or expired code');
    }
    await this.addMethod(context, 'EMAIL');
    return this.finishEnrollment(context);
  }

  createPasskeyRegistrationOptions(
    context: AuthContext,
    requestOrigin: string,
  ): Promise<PublicKeyCredentialCreationOptionsJSON> {
    this.assertFull(context);
    return this.passkeyService.createRegistrationOptions(context, requestOrigin);
  }

  async verifyPasskeyRegistration(
    context: AuthContext,
    response: RegistrationResponseJSON,
    name: string | undefined,
  ): Promise<EnrollmentResult> {
    this.assertFull(context);
    await this.passkeyService.verifyRegistration(context, response, name);
    return this.finishEnrollment(context);
  }

  createPasskeyAuthenticationOptions(
    context: AuthContext,
    requestOrigin: string,
  ): Promise<PublicKeyCredentialRequestOptionsJSON> {
    this.assertPending(context);
    return this.passkeyService.createAuthenticationOptions(context, requestOrigin);
  }

  async verifyPasskeyAuthentication(
    context: AuthContext,
    response: AuthenticationResponseJSON,
  ): Promise<AuthOutcome> {
    this.assertPending(context);
    if (!(await this.passkeyService.verifyAuthentication(context, response))) {
      await this.rejectAttempt(context);
    }
    return this.completeLogin(context);
  }

  regenerateRecoveryCodes(context: AuthContext): Promise<string[]> {
    this.assertFull(context);
    return this.recoveryCodeService.generate(context.user.id);
  }

  private async checkCode(context: AuthContext, dto: VerifyMfaDto): Promise<boolean> {
    const { user } = context;
    if (dto.method === 'recovery') {
      return this.recoveryCodeService.consume(user.id, dto.code);
    }
    if (dto.method === 'totp' && user.mfaMethods.includes('TOTP')) {
      return this.totpService.verifyLogin(user, dto.code);
    }
    if (dto.method === 'email' && user.mfaMethods.includes('EMAIL')) {
      return this.emailOtpService.verify(context, dto.code);
    }
    return false;
  }

  private async rejectAttempt(context: AuthContext): Promise<never> {
    const attempts = await this.sessionRepository.incrementMfaAttempts(context.session.id);
    if (attempts >= MAX_MFA_ATTEMPTS) {
      await this.sessionService.destroy(context.session.id);
      throw new UnauthorizedException('Too many failed attempts, sign in again');
    }
    throw new UnauthorizedException('Invalid code');
  }

  private async completeLogin(context: AuthContext): Promise<AuthOutcome> {
    const session = await this.sessionService.promote(context.session.id);
    return {
      session,
      body: { mfaRequired: false, methods: [], user: AuthUserMapper.toView(context.user) },
    };
  }

  private async addMethod(context: AuthContext, method: MfaMethod): Promise<void> {
    if (context.user.mfaMethods.includes(method)) {
      return;
    }
    await this.userRepository.setMfaMethods(context.user.id, [...context.user.mfaMethods, method]);
  }

  private async finishEnrollment(context: AuthContext): Promise<EnrollmentResult> {
    const isFirstMethod = context.user.mfaMethods.length === 0;
    const user = await this.userRepository.findById(context.user.id);
    if (!user) {
      throw new UnauthorizedException('Account no longer exists');
    }
    const recoveryCodes = isFirstMethod
      ? await this.recoveryCodeService.generate(user.id)
      : null;
    return { recoveryCodes, user: AuthUserMapper.toView(user) };
  }

  private assertPending(context: AuthContext): void {
    if (context.session.mfaPassed) {
      throw new BadRequestException('Session is already verified');
    }
  }

  private assertFull(context: AuthContext): void {
    if (!context.session.mfaPassed) {
      throw new UnauthorizedException('Complete sign-in first');
    }
  }
}
