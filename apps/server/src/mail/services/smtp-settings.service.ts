import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SMTP_SETTING_KEY } from '../../alerts/constants/alert.constants';
import { SmtpSettings, SmtpSettingsView } from '../../alerts/interfaces/alert.interfaces';
import { RoleValidator } from '../../auth/validators/role.validator';
import type { User } from '../../generated/prisma/client';
import { SecretCipher } from '../../shared/utils/secret-cipher.utils';
import { SaveSmtpDto } from '../dto/smtp.dto';
import { InstanceSettingRepository } from '../repositories/instance-setting.repository';

@Injectable()
export class SmtpSettingsService {
  constructor(
    private readonly configService: ConfigService,
    private readonly settingRepository: InstanceSettingRepository,
  ) {}

  async getEffective(): Promise<SmtpSettings | null> {
    return (await this.readStored()) ?? this.fromEnvironment();
  }

  async getView(user: User): Promise<SmtpSettingsView> {
    RoleValidator.assertAtLeast(user.role, 'ADMIN');
    const stored = await this.readStored();
    const effective = stored ?? this.fromEnvironment();
    if (!effective) {
      return {
        configured: false,
        source: 'none',
        host: null,
        port: null,
        secure: null,
        user: null,
        from: null,
        hasPassword: false,
      };
    }
    return {
      configured: true,
      source: stored ? 'database' : 'environment',
      host: effective.host,
      port: effective.port,
      secure: effective.secure,
      user: effective.user,
      from: effective.from,
      hasPassword: Boolean(effective.password),
    };
  }

  async save(user: User, dto: SaveSmtpDto): Promise<SmtpSettingsView> {
    RoleValidator.assertAtLeast(user.role, 'ADMIN');
    const existing = await this.readStored();
    const settings: SmtpSettings = {
      host: dto.host.trim(),
      port: dto.port,
      secure: dto.secure,
      user: dto.user?.trim() || null,
      password: dto.password ? dto.password : (existing?.password ?? null),
      from: dto.from.trim(),
    };
    await this.settingRepository.set(SMTP_SETTING_KEY, this.encrypt(JSON.stringify(settings)));
    return this.getView(user);
  }

  async clear(user: User): Promise<SmtpSettingsView> {
    RoleValidator.assertAtLeast(user.role, 'ADMIN');
    await this.settingRepository.remove(SMTP_SETTING_KEY);
    return this.getView(user);
  }

  private async readStored(): Promise<SmtpSettings | null> {
    const payload = await this.settingRepository.get(SMTP_SETTING_KEY);
    if (!payload) {
      return null;
    }
    return JSON.parse(SecretCipher.decrypt(payload, this.secretKey())) as SmtpSettings;
  }

  private fromEnvironment(): SmtpSettings | null {
    const host = this.configService.get<string | undefined>('mail.host');
    const from = this.configService.get<string | undefined>('mail.from');
    if (!host || !from) {
      return null;
    }
    return {
      host,
      port: this.configService.getOrThrow<number>('mail.port'),
      secure: this.configService.getOrThrow<boolean>('mail.secure'),
      user: this.configService.get<string | undefined>('mail.user') ?? null,
      password: this.configService.get<string | undefined>('mail.password') ?? null,
      from,
    };
  }

  private encrypt(value: string): string {
    return SecretCipher.encrypt(value, this.secretKey());
  }

  private secretKey(): string {
    return this.configService.getOrThrow<string>('security.secretKey');
  }
}
