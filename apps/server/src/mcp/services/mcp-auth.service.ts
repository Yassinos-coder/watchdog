import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { ApiKey } from '../../generated/prisma/client';
import { API_KEY_PREFIX, KEY_LAST_USED_THROTTLE_MS } from '../constants/mcp.constants';
import { ApiKeyRepository } from '../repositories/api-key.repository';
import { ApiKeysService } from './api-keys.service';

const BEARER = /^Bearer\s+(\S+)$/i;

@Injectable()
export class McpAuthService {
  private readonly touched = new Map<string, number>();

  constructor(private readonly keyRepository: ApiKeyRepository) {}

  async authenticate(header: string | undefined, now = Date.now()): Promise<ApiKey> {
    const token = header ? BEARER.exec(header.trim())?.[1] : undefined;
    if (!token || !token.startsWith(API_KEY_PREFIX)) {
      throw new UnauthorizedException('Send your API key as "Authorization: Bearer <key>"');
    }
    const key = await this.keyRepository.findByHash(ApiKeysService.hash(token));
    if (!key) {
      throw new UnauthorizedException('This API key is not valid');
    }
    await this.recordUse(key.id, now);
    return key;
  }

  private async recordUse(id: string, now: number): Promise<void> {
    const last = this.touched.get(id) ?? 0;
    if (now - last < KEY_LAST_USED_THROTTLE_MS) {
      return;
    }
    this.touched.set(id, now);
    await this.keyRepository.touch(id).catch(() => undefined);
  }
}
