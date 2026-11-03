import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { TokenUtils } from '../../shared/utils/token.utils';
import {
  PENDING_SESSION_TTL_MS,
  SESSION_CLEANUP_INTERVAL_MS,
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
} from '../constants/auth.constants';
import { IssuedSession, SessionMeta, SessionWithUser } from '../interfaces/auth.interfaces';
import { SessionRepository } from '../repositories/session.repository';

@Injectable()
export class SessionService implements OnModuleInit, OnModuleDestroy {
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit(): void {
    this.cleanupTimer = setInterval(() => {
      void this.sessionRepository.deleteExpired().catch(() => undefined);
    }, SESSION_CLEANUP_INTERVAL_MS);
    this.cleanupTimer.unref();
  }

  onModuleDestroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }

  async resolve(rawToken: string): Promise<SessionWithUser | null> {
    const session = await this.sessionRepository.findByTokenHash(TokenUtils.sha256(rawToken));
    if (!session) {
      return null;
    }
    if (session.expiresAt.getTime() <= Date.now() || session.user.disabledAt) {
      await this.sessionRepository.delete(session.id);
      return null;
    }
    return session;
  }

  async issue(userId: string, mfaPassed: boolean, meta: SessionMeta): Promise<IssuedSession> {
    const issued = this.mint(mfaPassed);
    await this.sessionRepository.create({
      userId,
      tokenHash: TokenUtils.sha256(issued.token),
      mfaPassed,
      expiresAt: issued.expiresAt,
      userAgent: meta.userAgent?.slice(0, 255),
      ip: meta.ip,
    });
    return issued;
  }

  async promote(sessionId: string): Promise<IssuedSession> {
    const issued = this.mint(true);
    await this.sessionRepository.promote(sessionId, TokenUtils.sha256(issued.token), issued.expiresAt);
    return issued;
  }

  destroy(sessionId: string): Promise<void> {
    return this.sessionRepository.delete(sessionId);
  }

  attach(response: Response, issued: IssuedSession): void {
    response.cookie(SESSION_COOKIE_NAME, issued.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.configService.getOrThrow<boolean>('security.secureCookies'),
      path: '/',
      expires: issued.expiresAt,
    });
  }

  clear(response: Response): void {
    response.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
  }

  private mint(mfaPassed: boolean): IssuedSession {
    const ttl = mfaPassed ? SESSION_TTL_MS : PENDING_SESSION_TTL_MS;
    return { token: TokenUtils.generate(), expiresAt: new Date(Date.now() + ttl) };
  }
}
