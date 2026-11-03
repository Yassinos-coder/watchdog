import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/bootstrap/configure-app';
import { LoggerOptionsFactory } from '../../src/logging/factories/logger-options.factory';

export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication({ bodyParser: false });
  app.useLogger(WinstonModule.createLogger(LoggerOptionsFactory.fromEnvironment()));
  configureApp(app);
  await app.init();
  return app;
}
