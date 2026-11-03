import type { User } from '../../generated/prisma/client';
import { AuthUserView } from '../interfaces/auth.interfaces';

export class AuthUserMapper {
  static needsMfaSetup(user: User): boolean {
    return user.role !== 'MEMBER' && user.mfaMethods.length === 0;
  }

  static toView(user: User): AuthUserView {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      mfaMethods: user.mfaMethods,
      needsMfaSetup: AuthUserMapper.needsMfaSetup(user),
    };
  }
}
