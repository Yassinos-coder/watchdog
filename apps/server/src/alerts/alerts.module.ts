import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/projects.module';
import { CHANNEL_SENDERS } from './alerts.tokens';
import { AlertsController } from './controllers/alerts.controller';
import { IssueSignalListener } from './listeners/issue-signal.listener';
import { AlertChannelRepository } from './repositories/alert-channel.repository';
import { AlertDeliveryRepository } from './repositories/alert-delivery.repository';
import { AlertRuleRepository } from './repositories/alert-rule.repository';
import { DiscordSender } from './senders/discord.sender';
import { EmailSender } from './senders/email.sender';
import { SlackSender } from './senders/slack.sender';
import { TelegramSender } from './senders/telegram.sender';
import { AlertChannelsService } from './services/alert-channels.service';
import { AlertDispatchService } from './services/alert-dispatch.service';
import { AlertRulesService } from './services/alert-rules.service';
import { HttpPoster } from './services/http-poster.service';

@Module({
  imports: [ProjectsModule],
  controllers: [AlertsController],
  providers: [
    HttpPoster,
    SlackSender,
    DiscordSender,
    TelegramSender,
    EmailSender,
    {
      provide: CHANNEL_SENDERS,
      useFactory: (slack: SlackSender, discord: DiscordSender, telegram: TelegramSender, email: EmailSender) => [
        slack,
        discord,
        telegram,
        email,
      ],
      inject: [SlackSender, DiscordSender, TelegramSender, EmailSender],
    },
    AlertChannelRepository,
    AlertRuleRepository,
    AlertDeliveryRepository,
    AlertChannelsService,
    AlertRulesService,
    AlertDispatchService,
    IssueSignalListener,
  ],
})
export class AlertsModule {}
