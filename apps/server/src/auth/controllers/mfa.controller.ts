import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseEnumPipe,
  Post,
  Res,
} from '@nestjs/common';
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
import { RequestOrigin } from '../decorators/request-origin.decorator';
import { ConfirmCodeDto, PasskeyResponseDto, VerifyMfaDto } from '../dto/auth.dto';
import {
  AuthContext,
  AuthResponse,
  EnrollmentResult,
  SecuritySummary,
  TotpEnrollment,
} from '../interfaces/auth.interfaces';
import { MfaService } from '../services/mfa.service';
import { SecurityService } from '../services/security.service';
import { SessionService } from '../services/session.service';

const MFA_LIMIT = { limit: 30, ttl: 60_000 };

@RateLimit(MFA_LIMIT)
@Controller('auth/mfa')
export class MfaController {
  constructor(
    private readonly mfaService: MfaService,
    private readonly securityService: SecurityService,
    private readonly sessionService: SessionService,
  ) {}

  @AllowMfaSetup()
  @Get('summary')
  getSummary(
    @CurrentAuth() auth: AuthContext,
    @RequestOrigin() requestOrigin: string,
  ): Promise<SecuritySummary> {
    return this.securityService.getSummary(auth, requestOrigin);
  }

  @AllowMfaSetup()
  @HttpCode(204)
  @Delete('passkeys/:passkeyId')
  removePasskey(
    @CurrentAuth() auth: AuthContext,
    @Param('passkeyId') passkeyId: string,
  ): Promise<void> {
    return this.securityService.removePasskey(auth, passkeyId);
  }

  @HttpCode(204)
  @Delete('methods/:method')
  disableMethod(
    @CurrentAuth() auth: AuthContext,
    @Param('method', new ParseEnumPipe({ TOTP: 'TOTP', EMAIL: 'EMAIL' })) method: 'TOTP' | 'EMAIL',
  ): Promise<void> {
    return this.securityService.disableMethod(auth, method);
  }

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
    @RequestOrigin() requestOrigin: string,
  ): Promise<PublicKeyCredentialCreationOptionsJSON> {
    return this.mfaService.createPasskeyRegistrationOptions(auth, requestOrigin);
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
    @RequestOrigin() requestOrigin: string,
  ): Promise<PublicKeyCredentialRequestOptionsJSON> {
    return this.mfaService.createPasskeyAuthenticationOptions(auth, requestOrigin);
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
