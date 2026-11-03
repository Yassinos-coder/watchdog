import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import type { Express } from 'express';
import helmet from 'helmet';
import { CorsOptionsFactory } from '../config/factories/cors-options.factory';
import { INGEST_BODY_LIMIT } from '../ingest/constants/ingest.constants';
import { noStore } from '../shared/http/no-store.middleware';
import { requestLogger } from '../shared/http/request-logger.middleware';

export function configureApp(app: INestApplication): void {
  const configService = app.get(ConfigService);
  const apiPrefix = configService.getOrThrow<string>('apiPrefix');
  const express = app.getHttpAdapter().getInstance() as Express;

  express.disable('x-powered-by');
  express.set('trust proxy', configService.getOrThrow<number | boolean>('security.trustProxy'));

  app.use(requestLogger);
  app.use(json({ limit: INGEST_BODY_LIMIT, type: ['application/json', 'text/plain'] }));
  app.use(urlencoded({ extended: true }));
  app.use(helmet());
  app.use(cookieParser());
  app.use(`/${apiPrefix}`, noStore);
  app.setGlobalPrefix(apiPrefix);
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.enableCors(
    CorsOptionsFactory.create(configService.getOrThrow<string[]>('corsOrigins'), apiPrefix),
  );
  app.enableShutdownHooks();
}
