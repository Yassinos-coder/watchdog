import { Global, Module } from '@nestjs/common';
import { SmtpSettingsController } from './controllers/smtp-settings.controller';
import { MailService } from './mail.service';
import { InstanceSettingRepository } from './repositories/instance-setting.repository';
import { SmtpSettingsService } from './services/smtp-settings.service';

@Global()
@Module({
  controllers: [SmtpSettingsController],
  providers: [InstanceSettingRepository, SmtpSettingsService, MailService],
  exports: [MailService, SmtpSettingsService, InstanceSettingRepository],
})
export class MailModule {}
