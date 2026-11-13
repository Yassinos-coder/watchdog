import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ShieldModule } from 'nestjs-shield';
import { AlertsModule } from './alerts/alerts.module';
import { AuthModule } from './auth/auth.module';
import configuration from './config/configuration';
import { ShieldOptionsFactory } from './config/factories/shield-options.factory';
import { EnvironmentValidator } from './config/validators/environment.validator';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { IngestModule } from './ingest/ingest.module';
import { IssuesModule } from './issues/issues.module';
import { LifecycleModule } from './lifecycle/lifecycle.module';
import { MailModule } from './mail/mail.module';
import { OAuthModule } from './oauth/oauth.module';
import { PerformanceModule } from './performance/performance.module';
import { ProjectsModule } from './projects/projects.module';
import { ReplaysModule } from './replays/replays.module';
import { PublicConfigModule } from './public-config/public-config.module';
import { RetentionModule } from './retention/retention.module';
import { SourceMapsModule } from './source-maps/source-maps.module';
import { StaticWebModule } from './static-web/static-web.module';
import { TeamModule } from './team/team.module';
import { UpdatesModule } from './updates/updates.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env', '../../.env'],
      validate: EnvironmentValidator.validate,
    }),
    EventEmitterModule.forRoot(),
    ShieldModule.forEnv(ShieldOptionsFactory.fromEnvironment()),
    DatabaseModule,
    MailModule,
    UsersModule,
    AuthModule,
    ProjectsModule,
    SourceMapsModule,
    IngestModule,
    IssuesModule,
    PerformanceModule,
    ReplaysModule,
    RetentionModule,
    TeamModule,
    OAuthModule,
    UpdatesModule,
    AlertsModule,
    LifecycleModule,
    HealthModule,
    PublicConfigModule,
    StaticWebModule.register(),
  ],
})
export class AppModule {}
