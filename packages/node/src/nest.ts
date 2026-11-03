import { ArgumentsHost, Catch } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { ExceptionPolicy } from './exception-policy';
import { captureRequestError } from './node-sdk';

@Catch()
export class WatchdogExceptionFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    if (ExceptionPolicy.shouldReport(exception) && host.getType() === 'http') {
      const request = host.switchToHttp().getRequest();
      captureRequestError(exception, request, { handled: true, tags: { mechanism: 'nestjs' } });
    }
    super.catch(exception, host);
  }
}
