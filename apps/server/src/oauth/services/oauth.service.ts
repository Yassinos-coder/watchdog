import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthUserMapper } from '../../auth/mappers/auth-user.mapper';
import { SessionMeta } from '../../auth/interfaces/auth.interfaces';
import { SessionService } from '../../auth/services/session.service';
import type { User } from '../../generated/prisma/client';
import { PasswordUtils } from '../../shared/utils/password.utils';
import { TokenUtils } from '../../shared/utils/token.utils';
import { InviteRepository } from '../../team/repositories/invite.repository';
import { UserRepository } from '../../users/repositories/user.repository';
import { OAUTH_PROVIDERS } from '../constants/oauth.constants';
import type {
  OAuthCredentials,
  OAuthProfile,
  OAuthProviderId,
  OAuthProviderView,
  OAuthResult,
  OAuthStart,
} from '../interfaces/oauth.interfaces';
import { OAuthProfileService } from './oauth-profile.service';

@Injectable()
export class OAuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly profileService: OAuthProfileService,
    private readonly userRepository: UserRepository,
    private readonly inviteRepository: InviteRepository,
    private readonly sessionService: SessionService,
  ) {}

  listProviders(): OAuthProviderView[] {
    return (Object.keys(OAUTH_PROVIDERS) as OAuthProviderId[])
      .filter((id) => this.credentials(id) !== null)
      .map((id) => ({ id, label: OAUTH_PROVIDERS[id].label }));
  }

  start(provider: OAuthProviderId): OAuthStart {
    const credentials = this.requireCredentials(provider);
    const state = TokenUtils.generate(24);
    const params = new URLSearchParams({
      client_id: credentials.clientId,
      redirect_uri: this.redirectUri(provider),
      response_type: 'code',
      scope: OAUTH_PROVIDERS[provider].scope,
      state,
    });
    return { url: `${OAUTH_PROVIDERS[provider].authorizeUrl}?${params.toString()}`, state };
  }

  async complete(provider: OAuthProviderId, code: string, meta: SessionMeta): Promise<OAuthResult | null> {
    const credentials = this.requireCredentials(provider);
    const profile = await this.profileService.fetchProfile(
      provider,
      credentials,
      code,
      this.redirectUri(provider),
    );
    if (!profile) {
      return null;
    }
    const user = await this.resolveUser(profile);
    if (!user || user.disabledAt) {
      return null;
    }
    const mfaPending = user.mfaMethods.length > 0;
    const issued = await this.sessionService.issue(user.id, !mfaPending, meta);
    return { ...issued, redirectPath: this.redirectPath(user, mfaPending) };
  }

  private async resolveUser(profile: OAuthProfile): Promise<User | null> {
    const existing = await this.userRepository.findByEmail(profile.email);
    if (existing) {
      return existing;
    }
    const invite = await this.inviteRepository.findPendingByEmail(profile.email, new Date());
    if (!invite) {
      return null;
    }
    return this.inviteRepository.accept({
      inviteId: invite.id,
      email: invite.email,
      role: invite.role,
      name: profile.name,
      passwordHash: await PasswordUtils.hash(TokenUtils.generate(32)),
    });
  }

  private redirectPath(user: User, mfaPending: boolean): string {
    if (mfaPending) {
      return '/login/verify';
    }
    return AuthUserMapper.needsMfaSetup(user) ? '/security/setup' : '/';
  }

  private redirectUri(provider: OAuthProviderId): string {
    const appUrl = this.configService.getOrThrow<string>('appUrl');
    const prefix = this.configService.getOrThrow<string>('apiPrefix');
    return `${appUrl}/${prefix}/oauth/${provider}/callback`;
  }

  private requireCredentials(provider: OAuthProviderId): OAuthCredentials {
    const credentials = this.credentials(provider);
    if (!credentials) {
      throw new NotFoundException('This sign-in provider is not configured');
    }
    return credentials;
  }

  private credentials(provider: OAuthProviderId): OAuthCredentials | null {
    const configured = this.configService.get<Partial<OAuthCredentials>>(`oauth.${provider}`);
    if (!configured?.clientId || !configured.clientSecret) {
      return null;
    }
    return { clientId: configured.clientId, clientSecret: configured.clientSecret };
  }
}
