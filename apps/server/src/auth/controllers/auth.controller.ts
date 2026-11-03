import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { RateLimit } from 'nestjs-shield';
import { AllowMfaSetup, AllowPendingMfa, Public } from '../decorators/access.decorators';
import { CurrentAuth, OptionalAuth } from '../decorators/current-auth.decorator';
import { LoginDto, SetupDto } from '../dto/auth.dto';
import {
  AuthContext,
  AuthResponse,
  AuthStatus,
  AuthUserView,
} from '../interfaces/auth.interfaces';
import { AuthUserMapper } from '../mappers/auth-user.mapper';
import { SessionMetaMapper } from '../mappers/session-meta.mapper';
import { AuthService } from '../services/auth.service';
import { SessionService } from '../services/session.service';

const AUTH_LIMIT = { limit: 20, ttl: 60_000 };

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
  ) {}

  @Public()
  @Get('status')
  getStatus(): Promise<AuthStatus> {
    return this.authService.getStatus();
  }

  @Public()
  @Get('session')
  getSession(@OptionalAuth() auth: AuthContext | undefined): AuthResponse {
    return this.authService.getSession(auth);
  }

  @AllowMfaSetup()
  @Get('me')
  getMe(@CurrentAuth() auth: AuthContext): AuthUserView {
    return AuthUserMapper.toView(auth.user);
  }

  @Public()
  @RateLimit(AUTH_LIMIT)
  @Post('setup')
  async setup(
    @Body() dto: SetupDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponse> {
    const outcome = await this.authService.setup(dto, SessionMetaMapper.fromRequest(request));
    this.sessionService.attach(response, outcome.session);
    return outcome.body;
  }

  @Public()
  @RateLimit(AUTH_LIMIT)
  @HttpCode(200)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponse> {
    const outcome = await this.authService.login(dto, SessionMetaMapper.fromRequest(request));
    this.sessionService.attach(response, outcome.session);
    return outcome.body;
  }

  @AllowPendingMfa()
  @AllowMfaSetup()
  @HttpCode(204)
  @Post('logout')
  async logout(
    @CurrentAuth() auth: AuthContext,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.authService.logout(auth.session.id);
    this.sessionService.clear(response);
  }
}
