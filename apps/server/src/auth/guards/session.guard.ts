import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  ALLOW_MFA_SETUP_KEY,
  ALLOW_PENDING_MFA_KEY,
  IS_PUBLIC_KEY,
  SESSION_COOKIE_NAME,
} from '../constants/auth.constants';
import { AuthenticatedRequest } from '../interfaces/auth.interfaces';
import { AuthUserMapper } from '../mappers/auth-user.mapper';
import { SessionService } from '../services/session.service';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessionService: SessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.hasFlag(IS_PUBLIC_KEY, context)) {
      return true;
    }
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token: unknown = request.cookies?.[SESSION_COOKIE_NAME];
    if (typeof token !== 'string' || token.length === 0) {
      throw new UnauthorizedException('Authentication required');
    }
    const session = await this.sessionService.resolve(token);
    if (!session) {
      throw new UnauthorizedException('Session expired');
    }
    request.auth = { session, user: session.user };

    if (!session.mfaPassed) {
      if (this.hasFlag(ALLOW_PENDING_MFA_KEY, context)) {
        return true;
      }
      throw new UnauthorizedException({ code: 'MFA_REQUIRED', message: 'Second factor required' });
    }
    if (AuthUserMapper.needsMfaSetup(session.user) && !this.hasFlag(ALLOW_MFA_SETUP_KEY, context)) {
      throw new ForbiddenException({
        code: 'MFA_SETUP_REQUIRED',
        message: 'Set up two-step verification to continue',
      });
    }
    return true;
  }

  private hasFlag(key: string, context: ExecutionContext): boolean {
    return Boolean(this.reflector.getAllAndOverride<boolean>(key, [context.getHandler(), context.getClass()]));
  }
}
