import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthContext, AuthenticatedRequest } from '../interfaces/auth.interfaces';

export const CurrentAuth = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthContext =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().auth,
);

export const OptionalAuth = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthContext | undefined =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().auth,
);
