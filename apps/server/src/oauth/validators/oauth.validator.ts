import { BadRequestException } from '@nestjs/common';
import { TokenUtils } from '../../shared/utils/token.utils';
import { OAUTH_PROVIDERS } from '../constants/oauth.constants';
import type { OAuthProviderId } from '../interfaces/oauth.interfaces';

export class OAuthValidator {
  static parseProvider(value: string): OAuthProviderId {
    if (!Object.prototype.hasOwnProperty.call(OAUTH_PROVIDERS, value)) {
      throw new BadRequestException('Unknown sign-in provider');
    }
    return value as OAuthProviderId;
  }

  static isStateValid(state: unknown, cookieState: unknown): boolean {
    return (
      typeof state === 'string' &&
      typeof cookieState === 'string' &&
      state.length > 0 &&
      TokenUtils.safeEqual(state, cookieState)
    );
  }
}
