import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ShieldModule } from 'nestjs-shield';
import { AuthModule } from './auth/auth.module';
import configuration from './config/configuration';
import { EnvironmentValidator } from './config/validators/environment.validator';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { IngestModule } from './ingest/ingest.module';
import { IssuesModule } from './issues/issues.module';
import { MailModule } from './mail/mail.module';
import { ProjectsModule } from './projects/projects.module';
import { SourceMapsModule } from './source-maps/source-maps.module';
import { StaticWebModule } from './static-web/static-web.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env', '../../.env'],
      validate: EnvironmentValidator.validate,
    }),
    ShieldModule.forEnv(),
    DatabaseModule,
    MailModule,
    UsersModule,
    AuthModule,
    ProjectsModule,
    SourceMapsModule,
    IngestModule,
    IssuesModule,
    HealthModule,
    StaticWebModule.register(),
  ],
})
export class AppModule {}
