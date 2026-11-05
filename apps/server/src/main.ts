import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';
import { AppModule } from './app.module';
import { configureApp } from './bootstrap/configure-app';
import { LoggerOptionsFactory } from './logging/factories/logger-options.factory';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
    logger: WinstonModule.createLogger(LoggerOptionsFactory.fromEnvironment()),
  });
  configureApp(app);

  const configService = app.get(ConfigService);
  const port = configService.getOrThrow<number>('port');
  await app.listen(port, '0.0.0.0');

  const logger = new Logger('Bootstrap');
  const appUrl = configService.getOrThrow<string>('appUrl');
  logger.log(`Watchdog listening on ${appUrl} (port ${port})`);
  if (!configService.getOrThrow<boolean>('appUrlExplicit') && !appUrl.startsWith('http://localhost')) {
    logger.warn(
      `APP_URL is not set, so ${appUrl} was taken from the hosting provider. If you move Watchdog to another domain, set APP_URL to the new address before adding passkeys.`,
    );
  }
}

void bootstrap();
