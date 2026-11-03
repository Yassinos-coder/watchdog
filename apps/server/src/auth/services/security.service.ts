import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MailService } from '../../mail/mail.service';
import { UserRepository } from '../../users/repositories/user.repository';
import { AuthContext, SecuritySummary } from '../interfaces/auth.interfaces';
import { AuthUserMapper } from '../mappers/auth-user.mapper';
import { PasskeyRepository } from '../repositories/passkey.repository';
import { RecoveryCodeRepository } from '../repositories/recovery-code.repository';

@Injectable()
export class SecurityService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passkeyRepository: PasskeyRepository,
    private readonly recoveryCodeRepository: RecoveryCodeRepository,
    private readonly mailService: MailService,
  ) {}

  async getSummary({ user }: AuthContext): Promise<SecuritySummary> {
    const [passkeys, recoveryCodesRemaining] = await Promise.all([
      this.passkeyRepository.findByUser(user.id),
      this.recoveryCodeRepository.countUnused(user.id),
    ]);
    return {
      methods: user.mfaMethods,
      passkeys: passkeys.map((passkey) => ({
        id: passkey.id,
        name: passkey.name,
        deviceType: passkey.deviceType,
        createdAt: passkey.createdAt,
        lastUsedAt: passkey.lastUsedAt,
      })),
      recoveryCodesRemaining,
      emailCodeAvailable: await this.mailService.isConfigured(),
    };
  }

  async removePasskey({ user }: AuthContext, passkeyId: string): Promise<void> {
    const remaining = await this.passkeyRepository.countByUser(user.id);
    const isLastPasskey = remaining <= 1;
    if (isLastPasskey) {
      this.assertCanDisable(user, 'PASSKEY');
    }
    if (!(await this.passkeyRepository.deleteForUser(user.id, passkeyId))) {
      throw new NotFoundException('Passkey not found');
    }
    if (isLastPasskey) {
      const methods = user.mfaMethods.filter((method) => method !== 'PASSKEY');
      await this.userRepository.setMfaMethods(user.id, methods);
      await this.clearRecoveryCodesIfUnprotected(user.id, methods.length);
    }
  }

  async disableMethod({ user }: AuthContext, method: 'TOTP' | 'EMAIL'): Promise<void> {
    if (!user.mfaMethods.includes(method)) {
      throw new NotFoundException('That method is not enabled');
    }
    this.assertCanDisable(user, method);
    const methods = user.mfaMethods.filter((candidate) => candidate !== method);
    if (method === 'TOTP') {
      await this.userRepository.disableTotp(user.id, methods);
    } else {
      await this.userRepository.setMfaMethods(user.id, methods);
    }
    await this.clearRecoveryCodesIfUnprotected(user.id, methods.length);
  }

  private assertCanDisable(user: AuthContext['user'], method: string): void {
    const others = user.mfaMethods.filter((candidate) => candidate !== method);
    if (others.length === 0 && AuthUserMapper.needsMfaSetupRole(user)) {
      throw new BadRequestException(
        'Administrators must keep at least one two-step verification method',
      );
    }
  }

  private async clearRecoveryCodesIfUnprotected(
    userId: string,
    remainingMethods: number,
  ): Promise<void> {
    if (remainingMethods === 0) {
      await this.recoveryCodeRepository.deleteAll(userId);
    }
  }
}
