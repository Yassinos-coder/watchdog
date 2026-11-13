import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { User } from '../../generated/prisma/client';
import { PasswordUtils } from '../../shared/utils/password.utils';
import { UserRepository } from '../../users/repositories/user.repository';
import { ChangeEmailDto, ChangePasswordDto, UpdateProfileDto } from '../dto/profile.dto';
import { AuthUserView, SessionView } from '../interfaces/auth.interfaces';
import { AuthUserMapper } from '../mappers/auth-user.mapper';
import { SessionRepository } from '../repositories/session.repository';
import { PasswordValidator } from '../validators/password.validator';

@Injectable()
export class ProfileService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository,
  ) {}

  async updateName(user: User, dto: UpdateProfileDto): Promise<AuthUserView> {
    const updated = await this.userRepository.updateProfile(user.id, { name: dto.name.trim() });
    return AuthUserMapper.toView(updated);
  }

  async changeEmail(user: User, dto: ChangeEmailDto): Promise<AuthUserView> {
    await this.assertPassword(user, dto.currentPassword);
    if (dto.email === user.email) {
      return AuthUserMapper.toView(user);
    }
    if (await this.userRepository.findByEmail(dto.email)) {
      throw new ConflictException('That email address is already used by another account');
    }
    return AuthUserMapper.toView(await this.userRepository.updateProfile(user.id, { email: dto.email }));
  }

  async changePassword(user: User, sessionId: string, dto: ChangePasswordDto): Promise<void> {
    await this.assertPassword(user, dto.currentPassword);
    if (dto.newPassword === dto.currentPassword) {
      throw new BadRequestException('Choose a password you have not used just now');
    }
    PasswordValidator.assertAcceptable(dto.newPassword, user.email);
    await this.userRepository.updatePasswordHash(user.id, await PasswordUtils.hash(dto.newPassword));
    await this.sessionRepository.deleteOthers(user.id, sessionId);
  }

  async listSessions(user: User, currentId: string): Promise<SessionView[]> {
    const sessions = await this.sessionRepository.listActive(user.id);
    return sessions.map((session) => ({
      id: session.id,
      userAgent: session.userAgent,
      ip: session.ip,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      current: session.id === currentId,
    }));
  }

  async revokeSession(user: User, currentId: string, id: string): Promise<void> {
    if (id === currentId) {
      throw new BadRequestException('Use Sign out to end this session');
    }
    if ((await this.sessionRepository.deleteOwned(user.id, id)) === 0) {
      throw new NotFoundException('Session not found');
    }
  }

  async revokeOtherSessions(user: User, currentId: string): Promise<void> {
    await this.sessionRepository.deleteOthers(user.id, currentId);
  }

  private async assertPassword(user: User, password: string): Promise<void> {
    if (!(await PasswordUtils.verify(password, user.passwordHash))) {
      throw new ForbiddenException('Your current password is not right');
    }
  }
}
