import { Module } from '@nestjs/common';
import { AlertsModule } from '../alerts/alerts.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { ONLINE_DELAY, ONLINE_DELAY_MS } from './constants/lifecycle.constants';
import { LifecycleRecordRepository } from './repositories/lifecycle-record.repository';
import { ProjectActivityRepository } from './repositories/project-activity.repository';
import { LifecycleNotifier } from './services/lifecycle-notifier.service';
import { LifecycleService } from './services/lifecycle.service';

@Module({
  imports: [AlertsModule, WebhooksModule],
  providers: [
    { provide: ONLINE_DELAY, useValue: ONLINE_DELAY_MS },
    LifecycleRecordRepository,
    ProjectActivityRepository,
    LifecycleNotifier,
    LifecycleService,
  ],
})
export class LifecycleModule {}
