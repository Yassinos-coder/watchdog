import { Controller, Get, Param, Query, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { RateLimit } from 'nestjs-shield';
import { Public } from '../../auth/decorators/access.decorators';
import { SessionMetaMapper } from '../../auth/mappers/session-meta.mapper';
import { SessionService } from '../../auth/services/session.service';
import { OAUTH_STATE_COOKIE, OAUTH_STATE_TTL_MS } from '../constants/oauth.constants';
import type { OAuthProviderView } from '../interfaces/oauth.interfaces';
import { OAuthService } from '../services/oauth.service';
import { OAuthValidator } from '../validators/oauth.validator';

const OAUTH_LIMIT = { limit: 30, ttl: 60_000 };
const FAILURE_PATH = '/login?oauth=failed';

@Public()
@Controller('oauth')
export class OAuthController {
  constructor(
    private readonly oauthService: OAuthService,
    private readonly sessionService: SessionService,
    private readonly configService: ConfigService,
  ) {}

  @Get('providers')
  listProviders(): OAuthProviderView[] {
    return this.oauthService.listProviders();
  }

  @RateLimit(OAUTH_LIMIT)
  @Get(':provider/start')
  start(@Param('provider') providerParam: string, @Res() response: Response): void {
    const { url, state } = this.oauthService.start(OAuthValidator.parseProvider(providerParam));
    response.cookie(OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.configService.getOrThrow<boolean>('security.secureCookies'),
      path: '/',
      maxAge: OAUTH_STATE_TTL_MS,
    });
    response.redirect(url);
  }

  @RateLimit(OAUTH_LIMIT)
  @Get(':provider/callback')
  async callback(
    @Param('provider') providerParam: string,
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    const provider = OAuthValidator.parseProvider(providerParam);
    const cookieState: unknown = request.cookies?.[OAUTH_STATE_COOKIE];
    response.clearCookie(OAUTH_STATE_COOKIE, { path: '/' });
    if (!code || !OAuthValidator.isStateValid(state, cookieState)) {
      response.redirect(FAILURE_PATH);
      return;
    }
    const result = await this.oauthService.complete(provider, code, SessionMetaMapper.fromRequest(request));
    if (!result) {
      response.redirect(FAILURE_PATH);
      return;
    }
    this.sessionService.attach(response, result);
    response.redirect(result.redirectPath);
  }
}
