import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { RoleValidator } from '../../auth/validators/role.validator';
import type { User } from '../../generated/prisma/client';
import { UserRepository } from '../../users/repositories/user.repository';
import type { TeamMemberView } from '../interfaces/team.interfaces';
import { TeamMapper } from '../mappers/team.mapper';
import { TeamValidator } from '../validators/team.validator';

@Injectable()
export class TeamService {
  constructor(private readonly userRepository: UserRepository) {}

  async list(actor: User): Promise<TeamMemberView[]> {
    RoleValidator.assertAtLeast(actor.role, 'ADMIN');
    const users = await this.userRepository.listAll();
    return users.map(TeamMapper.toMember);
  }

  async changeRole(actor: User, userId: string, role: 'ADMIN' | 'MEMBER'): Promise<TeamMemberView> {
    RoleValidator.assertAtLeast(actor.role, 'ADMIN');
    const target = await this.requireTarget(actor, userId);
    TeamValidator.assertCanGrant(actor.role, role);
    TeamValidator.assertOutranks(actor.role, target.role);
    const updated = await this.userRepository.updateRole(userId, role);
    return TeamMapper.toMember(updated);
  }

  async remove(actor: User, userId: string): Promise<void> {
    RoleValidator.assertAtLeast(actor.role, 'ADMIN');
    const target = await this.requireTarget(actor, userId);
    TeamValidator.assertOutranks(actor.role, target.role);
    await this.userRepository.remove(userId);
  }

  private async requireTarget(actor: User, userId: string): Promise<User> {
    if (actor.id === userId) {
      throw new BadRequestException('You cannot change your own account here');
    }
    const target = await this.userRepository.findById(userId);
    if (!target) {
      throw new NotFoundException('User not found');
    }
    return target;
  }
}
