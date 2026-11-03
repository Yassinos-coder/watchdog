import { Test, TestingModuleBuilder } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/bootstrap/configure-app';
import { LoggerOptionsFactory } from '../../src/logging/factories/logger-options.factory';

export async function createTestApp(
  customize?: (builder: TestingModuleBuilder) => TestingModuleBuilder,
): Promise<INestApplication> {
  const builder = Test.createTestingModule({ imports: [AppModule] });
  const moduleRef = await (customize ? customize(builder) : builder).compile();
  const app = moduleRef.createNestApplication({ bodyParser: false });
  app.useLogger(WinstonModule.createLogger(LoggerOptionsFactory.fromEnvironment()));
  configureApp(app);
  await app.init();
  return app;
}
