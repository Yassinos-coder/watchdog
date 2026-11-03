import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthUserMapper } from '../../auth/mappers/auth-user.mapper';
import { AuthOutcome, SessionMeta } from '../../auth/interfaces/auth.interfaces';
import { SessionService } from '../../auth/services/session.service';
import { PasswordValidator } from '../../auth/validators/password.validator';
import { RoleValidator } from '../../auth/validators/role.validator';
import type { User } from '../../generated/prisma/client';
import { MailService } from '../../mail/mail.service';
import { PasswordUtils } from '../../shared/utils/password.utils';
import { TokenUtils } from '../../shared/utils/token.utils';
import { UserRepository } from '../../users/repositories/user.repository';
import { INVITE_TTL_MS } from '../constants/team.constants';
import { AcceptInviteDto, CreateInviteDto } from '../dto/team.dto';
import type { CreatedInviteView, InvitePreview, InviteView } from '../interfaces/team.interfaces';
import { TeamMapper } from '../mappers/team.mapper';
import { InviteRepository } from '../repositories/invite.repository';
import { TeamValidator } from '../validators/team.validator';

const INVALID_INVITE_MESSAGE = 'This invite is invalid or has expired';

@Injectable()
export class InvitesService {
  private readonly logger = new Logger(InvitesService.name);

  constructor(
    private readonly inviteRepository: InviteRepository,
    private readonly userRepository: UserRepository,
    private readonly sessionService: SessionService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async list(actor: User): Promise<InviteView[]> {
    RoleValidator.assertAtLeast(actor.role, 'ADMIN');
    const invites = await this.inviteRepository.listPending(new Date());
    return invites.map(TeamMapper.toInvite);
  }

  async preview(token: string): Promise<InvitePreview> {
    const invite = await this.requirePending(token);
    return TeamMapper.toPreview(invite);
  }

  async create(actor: User, dto: CreateInviteDto): Promise<CreatedInviteView> {
    RoleValidator.assertAtLeast(actor.role, 'ADMIN');
    TeamValidator.assertCanGrant(actor.role, dto.role);
    if (await this.userRepository.findByEmail(dto.email)) {
      throw new ConflictException('A user with this email already exists');
    }
    const token = TokenUtils.generate();
    const invite = await this.inviteRepository.replaceForEmail({
      email: dto.email,
      role: dto.role,
      tokenHash: TokenUtils.sha256(token),
      invitedById: actor.id,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    });
    const link = `${this.configService.getOrThrow<string>('appUrl')}/invite/${token}`;
    const emailSent = await this.sendEmail(dto.email, actor.name, link);
    return { invite: TeamMapper.toInvite(invite), link, emailSent };
  }

  async accept(dto: AcceptInviteDto, meta: SessionMeta): Promise<AuthOutcome> {
    const invite = await this.requirePending(dto.token);
    PasswordValidator.assertAcceptable(dto.password, invite.email);
    if (await this.userRepository.findByEmail(invite.email)) {
      throw new ConflictException('A user with this email already exists');
    }
    const user = await this.inviteRepository.accept({
      inviteId: invite.id,
      email: invite.email,
      role: invite.role,
      name: dto.name.trim(),
      passwordHash: await PasswordUtils.hash(dto.password),
    });
    if (!user) {
      throw new NotFoundException(INVALID_INVITE_MESSAGE);
    }
    const session = await this.sessionService.issue(user.id, true, meta);
    return {
      session,
      body: { mfaRequired: false, methods: [], user: AuthUserMapper.toView(user) },
    };
  }

  async revoke(actor: User, inviteId: string): Promise<void> {
    RoleValidator.assertAtLeast(actor.role, 'ADMIN');
    const invite = await this.inviteRepository.findById(inviteId);
    if (!invite) {
      throw new NotFoundException('Invite not found');
    }
    TeamValidator.assertOutranks(actor.role, invite.role);
    await this.inviteRepository.remove(inviteId);
  }

  private async requirePending(token: string) {
    const invite = await this.inviteRepository.findPendingByTokenHash(TokenUtils.sha256(token), new Date());
    if (!invite) {
      throw new NotFoundException(INVALID_INVITE_MESSAGE);
    }
    return invite;
  }

  private async sendEmail(to: string, inviterName: string, link: string): Promise<boolean> {
    if (!(await this.mailService.isConfigured())) {
      return false;
    }
    try {
      await this.mailService.sendMail(
        [to],
        'You have been invited to Watchdog',
        `${inviterName} invited you to join Watchdog. Accept the invite here: ${link}\n\nThe link expires in 7 days.`,
      );
      return true;
    } catch (error) {
      this.logger.warn(`Invite email failed: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
}
