import { HttpRequestLike } from './interfaces';
import { captureRequestError } from './node-sdk';
import { ExceptionPolicy } from './exception-policy';

type NextFunction = (error?: unknown) => void;

export function expressErrorHandler() {
  return (error: unknown, request: HttpRequestLike, _response: unknown, next: NextFunction): void => {
    if (ExceptionPolicy.shouldReport(error)) {
      captureRequestError(error, request, { handled: true, tags: { mechanism: 'express' } });
    }
    next(error);
  };
}
