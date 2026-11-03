import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ShieldModule } from 'nestjs-shield';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { StaticWebModule } from './static-web/static-web.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration], envFilePath: ['.env', '../../.env'] }),
    ShieldModule.forEnv(),
    DatabaseModule,
    HealthModule,
    StaticWebModule.register(),
  ],
})
export class AppModule {}
