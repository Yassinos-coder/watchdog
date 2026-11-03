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

  new Logger('Bootstrap').log(
    `Watchdog listening on ${configService.getOrThrow<string>('appUrl')} (port ${port})`,
  );
}

void bootstrap();
