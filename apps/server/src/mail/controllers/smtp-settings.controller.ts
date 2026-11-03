import { Body, Controller, Delete, Get, HttpCode, Post, Put } from '@nestjs/common';
import type { SmtpSettingsView } from '../../alerts/interfaces/alert.interfaces';
import { CurrentAuth } from '../../auth/decorators/current-auth.decorator';
import { AuthContext } from '../../auth/interfaces/auth.interfaces';
import { RoleValidator } from '../../auth/validators/role.validator';
import { SaveSmtpDto, SendTestEmailDto } from '../dto/smtp.dto';
import { MailService } from '../mail.service';
import { SmtpSettingsService } from '../services/smtp-settings.service';

@Controller('settings/smtp')
export class SmtpSettingsController {
  constructor(
    private readonly smtpSettings: SmtpSettingsService,
    private readonly mailService: MailService,
  ) {}

  @Get()
  get(@CurrentAuth() auth: AuthContext): Promise<SmtpSettingsView> {
    return this.smtpSettings.getView(auth.user);
  }

  @Put()
  save(@CurrentAuth() auth: AuthContext, @Body() dto: SaveSmtpDto): Promise<SmtpSettingsView> {
    return this.smtpSettings.save(auth.user, dto);
  }

  @Delete()
  clear(@CurrentAuth() auth: AuthContext): Promise<SmtpSettingsView> {
    return this.smtpSettings.clear(auth.user);
  }

  @Post('test')
  @HttpCode(204)
  async sendTest(@CurrentAuth() auth: AuthContext, @Body() dto: SendTestEmailDto): Promise<void> {
    RoleValidator.assertAtLeast(auth.user.role, 'ADMIN');
    await this.mailService.sendMail([dto.to], 'Watchdog test email', 'Your Watchdog email settings work.');
  }
}
