import { ForbiddenException } from '@nestjs/common';
import type { UserRole } from '../../generated/prisma/enums';

const ROLE_RANK: Record<UserRole, number> = { MEMBER: 0, ADMIN: 1, OWNER: 2 };

export class TeamValidator {
  static assertCanGrant(actor: UserRole, granted: UserRole): void {
    if (ROLE_RANK[granted] >= ROLE_RANK[actor]) {
      throw new ForbiddenException('You can only grant roles below your own');
    }
  }

  static assertOutranks(actor: UserRole, target: UserRole): void {
    if (ROLE_RANK[target] >= ROLE_RANK[actor]) {
      throw new ForbiddenException('You can only manage people ranked below you');
    }
  }
}
