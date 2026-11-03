import type { NextFunction, Request, Response } from 'express';

const NO_STORE = 'no-store';

export const noStore = (_request: Request, response: Response, next: NextFunction): void => {
  response.setHeader('Cache-Control', NO_STORE);
  next();
};
