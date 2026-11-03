import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { MailService } from '../../mail/mail.service';
import { PasswordUtils } from '../../shared/utils/password.utils';
import { UserRepository } from '../../users/repositories/user.repository';
import { LOCK_DURATION_MS, MAX_FAILED_LOGINS } from '../constants/auth.constants';
import { LoginDto, SetupDto } from '../dto/auth.dto';
import {
  AuthContext,
  AuthOutcome,
  AuthResponse,
  AuthStatus,
  SessionMeta,
} from '../interfaces/auth.interfaces';
import { AuthUserMapper } from '../mappers/auth-user.mapper';
import { PasswordValidator } from '../validators/password.validator';
import { SessionService } from './session.service';
import { SetupTokenService } from './setup-token.service';

const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly sessionService: SessionService,
    private readonly setupTokenService: SetupTokenService,
    private readonly mailService: MailService,
  ) {}

  async getStatus(): Promise<AuthStatus> {
    return {
      setupRequired: (await this.userRepository.count()) === 0,
      emailCodeAvailable: await this.mailService.isConfigured(),
    };
  }

  getSession(auth: AuthContext | undefined): AuthResponse {
    if (!auth) {
      return { mfaRequired: false, methods: [], user: null };
    }
    const { session, user } = auth;
    if (!session.mfaPassed) {
      return { mfaRequired: true, methods: user.mfaMethods, user: null };
    }
    return { mfaRequired: false, methods: [], user: AuthUserMapper.toView(user) };
  }

  async setup(dto: SetupDto, meta: SessionMeta): Promise<AuthOutcome> {
    this.setupTokenService.assertValid(dto.setupToken);
    PasswordValidator.assertAcceptable(dto.password, dto.email);
    const owner = await this.userRepository.createFirstOwner({
      email: dto.email,
      name: dto.name.trim(),
      passwordHash: await PasswordUtils.hash(dto.password),
    });
    if (!owner) {
      throw new ConflictException('This instance is already set up');
    }
    const session = await this.sessionService.issue(owner.id, true, meta);
    return {
      session,
      body: { mfaRequired: false, methods: [], user: AuthUserMapper.toView(owner) },
    };
  }

  async login(dto: LoginDto, meta: SessionMeta): Promise<AuthOutcome> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user || user.disabledAt) {
      await PasswordUtils.burn(dto.password);
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }
    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      throw new HttpException(
        'Too many failed attempts, try again later',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (!(await PasswordUtils.verify(dto.password, user.passwordHash))) {
      await this.registerFailure(user.id, user.failedLoginCount + 1);
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }
    await this.userRepository.resetFailedLogins(user.id);

    if (user.mfaMethods.length > 0) {
      const session = await this.sessionService.issue(user.id, false, meta);
      return { session, body: { mfaRequired: true, methods: user.mfaMethods, user: null } };
    }
    const session = await this.sessionService.issue(user.id, true, meta);
    return {
      session,
      body: { mfaRequired: false, methods: [], user: AuthUserMapper.toView(user) },
    };
  }

  logout(sessionId: string): Promise<void> {
    return this.sessionService.destroy(sessionId);
  }

  private registerFailure(userId: string, failures: number): Promise<void> {
    const lockUntil =
      failures >= MAX_FAILED_LOGINS ? new Date(Date.now() + LOCK_DURATION_MS) : null;
    return this.userRepository.registerFailedLogin(userId, lockUntil);
  }
}
