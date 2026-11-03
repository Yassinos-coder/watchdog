import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { UsersModule } from '../users/users.module';
import { AuthController } from './controllers/auth.controller';
import { MfaController } from './controllers/mfa.controller';
import { SessionGuard } from './guards/session.guard';
import { PasskeyRepository } from './repositories/passkey.repository';
import { RecoveryCodeRepository } from './repositories/recovery-code.repository';
import { SessionRepository } from './repositories/session.repository';
import { AuthService } from './services/auth.service';
import { EmailOtpService } from './services/email-otp.service';
import { MfaService } from './services/mfa.service';
import { PasskeyService } from './services/passkey.service';
import { RecoveryCodeService } from './services/recovery-code.service';
import { SecurityService } from './services/security.service';
import { SessionService } from './services/session.service';
import { SetupTokenService } from './services/setup-token.service';
import { TotpService } from './services/totp.service';

@Module({
  imports: [UsersModule],
  controllers: [AuthController, MfaController],
  providers: [
    { provide: APP_GUARD, useClass: SessionGuard },
    SessionRepository,
    PasskeyRepository,
    RecoveryCodeRepository,
    SessionService,
    SetupTokenService,
    RecoveryCodeService,
    TotpService,
    EmailOtpService,
    PasskeyService,
    MfaService,
    SecurityService,
    AuthService,
  ],
  exports: [SessionService],
})
export class AuthModule {}
