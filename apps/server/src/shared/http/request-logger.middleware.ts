import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { RequestLogUtils } from './request-log.utils';

const NANOSECONDS_PER_MILLISECOND = 1_000_000n;
const SERVER_ERROR_STATUS = 500;
const CLIENT_ERROR_STATUS = 400;

const logger = new Logger('HTTP');

export const requestLogger = (request: Request, response: Response, next: NextFunction): void => {
  const startedAt = process.hrtime.bigint();

  response.on('finish', () => {
    const durationMs = Number((process.hrtime.bigint() - startedAt) / NANOSECONDS_PER_MILLISECOND);
    const message = `${request.method} ${RequestLogUtils.safeUrl(request.originalUrl)} ${response.statusCode} ${durationMs}ms`;

    if (response.statusCode >= SERVER_ERROR_STATUS) {
      logger.error(message);
      return;
    }
    if (response.statusCode >= CLIENT_ERROR_STATUS) {
      logger.warn(message);
      return;
    }
    if (RequestLogUtils.isQuiet(request.originalUrl)) {
      logger.debug(message);
      return;
    }
    logger.log(message);
  });

  next();
};
