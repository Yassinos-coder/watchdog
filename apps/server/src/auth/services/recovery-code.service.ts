import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { TokenUtils } from '../../shared/utils/token.utils';
import { RECOVERY_CODE_COUNT } from '../constants/auth.constants';
import { RecoveryCodeRepository } from '../repositories/recovery-code.repository';

@Injectable()
export class RecoveryCodeService {
  constructor(private readonly recoveryCodeRepository: RecoveryCodeRepository) {}

  async generate(userId: string): Promise<string[]> {
    const codes = Array.from({ length: RECOVERY_CODE_COUNT }, () => this.createCode());
    await this.recoveryCodeRepository.replaceAll(
      userId,
      codes.map((code) => TokenUtils.sha256(this.normalize(code))),
    );
    return codes;
  }

  consume(userId: string, code: string): Promise<boolean> {
    return this.recoveryCodeRepository.markUsed(userId, TokenUtils.sha256(this.normalize(code)));
  }

  private createCode(): string {
    const hex = randomBytes(5).toString('hex');
    return `${hex.slice(0, 5)}-${hex.slice(5)}`;
  }

  private normalize(code: string): string {
    return code.toLowerCase().replace(/[\s-]/g, '');
  }
}
