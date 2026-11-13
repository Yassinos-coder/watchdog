import { Module } from '@nestjs/common';
import { IssuesModule } from '../issues/issues.module';
import { ProjectsModule } from '../projects/projects.module';
import { WebhooksController } from './controllers/webhooks.controller';
import { WebhookEventsListener } from './listeners/webhook-events.listener';
import { WebhookRepository } from './repositories/webhook.repository';
import { WebhookDispatcher } from './services/webhook-dispatcher.service';
import { WebhookSender } from './services/webhook-sender.service';
import { WebhooksService } from './services/webhooks.service';

@Module({
  imports: [IssuesModule, ProjectsModule],
  controllers: [WebhooksController],
  providers: [WebhookRepository, WebhookSender, WebhookDispatcher, WebhooksService, WebhookEventsListener],
  exports: [WebhookDispatcher],
})
export class WebhooksModule {}
