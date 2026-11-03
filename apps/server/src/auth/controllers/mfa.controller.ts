import { Body, Controller, HttpCode, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { RateLimit } from 'nestjs-shield';
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/server';
import { AllowMfaSetup, AllowPendingMfa } from '../decorators/access.decorators';
import { CurrentAuth } from '../decorators/current-auth.decorator';
import { ConfirmCodeDto, PasskeyResponseDto, VerifyMfaDto } from '../dto/auth.dto';
import {
  AuthContext,
  AuthResponse,
  EnrollmentResult,
  TotpEnrollment,
} from '../interfaces/auth.interfaces';
import { MfaService } from '../services/mfa.service';
import { SessionService } from '../services/session.service';

const MFA_LIMIT = { limit: 30, ttl: 60_000 };

@RateLimit(MFA_LIMIT)
@Controller('auth/mfa')
export class MfaController {
  constructor(
    private readonly mfaService: MfaService,
    private readonly sessionService: SessionService,
  ) {}

  @AllowPendingMfa()
  @HttpCode(200)
  @Post('verify')
  async verify(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: VerifyMfaDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponse> {
    const outcome = await this.mfaService.verifyLogin(auth, dto);
    this.sessionService.attach(response, outcome.session);
    return outcome.body;
  }

  @AllowPendingMfa()
  @AllowMfaSetup()
  @HttpCode(204)
  @Post('email/send')
  sendEmailCode(@CurrentAuth() auth: AuthContext): Promise<void> {
    return this.mfaService.sendEmailCode(auth);
  }

  @AllowMfaSetup()
  @HttpCode(200)
  @Post('email/confirm')
  confirmEmail(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: ConfirmCodeDto,
  ): Promise<EnrollmentResult> {
    return this.mfaService.confirmEmailEnrollment(auth, dto.code);
  }

  @AllowMfaSetup()
  @HttpCode(200)
  @Post('totp/setup')
  beginTotp(@CurrentAuth() auth: AuthContext): Promise<TotpEnrollment> {
    return this.mfaService.beginTotpEnrollment(auth);
  }

  @AllowMfaSetup()
  @HttpCode(200)
  @Post('totp/confirm')
  confirmTotp(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: ConfirmCodeDto,
  ): Promise<EnrollmentResult> {
    return this.mfaService.confirmTotpEnrollment(auth, dto.code);
  }

  @AllowMfaSetup()
  @HttpCode(200)
  @Post('passkey/register/options')
  passkeyRegistrationOptions(
    @CurrentAuth() auth: AuthContext,
  ): Promise<PublicKeyCredentialCreationOptionsJSON> {
    return this.mfaService.createPasskeyRegistrationOptions(auth);
  }

  @AllowMfaSetup()
  @HttpCode(200)
  @Post('passkey/register/verify')
  passkeyRegistrationVerify(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: PasskeyResponseDto,
  ): Promise<EnrollmentResult> {
    return this.mfaService.verifyPasskeyRegistration(
      auth,
      dto.response as unknown as RegistrationResponseJSON,
      dto.name,
    );
  }

  @AllowPendingMfa()
  @HttpCode(200)
  @Post('passkey/authenticate/options')
  passkeyAuthenticationOptions(
    @CurrentAuth() auth: AuthContext,
  ): Promise<PublicKeyCredentialRequestOptionsJSON> {
    return this.mfaService.createPasskeyAuthenticationOptions(auth);
  }

  @AllowPendingMfa()
  @HttpCode(200)
  @Post('passkey/authenticate/verify')
  async passkeyAuthenticationVerify(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: PasskeyResponseDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponse> {
    const outcome = await this.mfaService.verifyPasskeyAuthentication(
      auth,
      dto.response as unknown as AuthenticationResponseJSON,
    );
    this.sessionService.attach(response, outcome.session);
    return outcome.body;
  }

  @HttpCode(200)
  @Post('recovery-codes/regenerate')
  async regenerateRecoveryCodes(
    @CurrentAuth() auth: AuthContext,
  ): Promise<{ recoveryCodes: string[] }> {
    return { recoveryCodes: await this.mfaService.regenerateRecoveryCodes(auth) };
  }
}
