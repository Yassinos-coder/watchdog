import { ForbiddenException } from '@nestjs/common';
import type { UserRole } from '../../generated/prisma/enums';

const ROLE_RANK: Record<UserRole, number> = { MEMBER: 0, ADMIN: 1, OWNER: 2 };

export class RoleValidator {
  static assertAtLeast(role: UserRole, required: UserRole): void {
    if (ROLE_RANK[role] < ROLE_RANK[required]) {
      throw new ForbiddenException('You do not have permission to do this');
    }
  }
}
