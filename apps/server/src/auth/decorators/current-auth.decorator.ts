import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthContext, AuthenticatedRequest } from '../interfaces/auth.interfaces';

export const CurrentAuth = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthContext =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().auth,
);
