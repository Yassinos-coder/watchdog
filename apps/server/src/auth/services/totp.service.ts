import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateSecret, generateURI, verify } from 'otplib';
import { toDataURL } from 'qrcode';
import type { User } from '../../generated/prisma/client';
import { SecretCipher } from '../../shared/utils/secret-cipher.utils';
import { UserRepository } from '../../users/repositories/user.repository';
import { TOTP_EPOCH_TOLERANCE_SECONDS, TOTP_ISSUER } from '../constants/auth.constants';
import { TotpEnrollment } from '../interfaces/auth.interfaces';

@Injectable()
export class TotpService {
  constructor(
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
  ) {}

  async beginEnrollment(user: User): Promise<TotpEnrollment> {
    const secret = generateSecret();
    await this.userRepository.setPendingTotpSecret(user.id, this.encrypt(secret));
    const otpauthUri = generateURI({ issuer: TOTP_ISSUER, label: user.email, secret });
    return { secret, otpauthUri, qrCodeDataUrl: await toDataURL(otpauthUri, { margin: 1 }) };
  }

  async confirmEnrollment(user: User, code: string): Promise<void> {
    if (!user.totpPendingSecretEnc) {
      throw new BadRequestException('Start authenticator setup first');
    }
    const secret = this.decrypt(user.totpPendingSecretEnc);
    if (!(await this.isValid(secret, code))) {
      throw new BadRequestException('Invalid code');
    }
    const methods = user.mfaMethods.includes('TOTP') ? user.mfaMethods : [...user.mfaMethods, 'TOTP' as const];
    await this.userRepository.activateTotp(user.id, user.totpPendingSecretEnc, methods);
  }

  async verifyLogin(user: User, code: string): Promise<boolean> {
    if (!user.totpSecretEnc) {
      return false;
    }
    return this.isValid(this.decrypt(user.totpSecretEnc), code);
  }

  private async isValid(secret: string, code: string): Promise<boolean> {
    const result = await verify({
      secret,
      token: code.replace(/\s/g, ''),
      epochTolerance: TOTP_EPOCH_TOLERANCE_SECONDS,
    });
    return result.valid;
  }

  private encrypt(value: string): string {
    return SecretCipher.encrypt(value, this.configService.getOrThrow<string>('security.secretKey'));
  }

  private decrypt(value: string): string {
    return SecretCipher.decrypt(value, this.configService.getOrThrow<string>('security.secretKey'));
  }
}
