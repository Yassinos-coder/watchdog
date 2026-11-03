import type { Request } from 'express';
import { SessionMeta } from '../interfaces/auth.interfaces';

export class SessionMetaMapper {
  static fromRequest(request: Request): SessionMeta {
    return {
      userAgent: request.headers['user-agent'],
      ip: request.ip,
    };
  }
}
