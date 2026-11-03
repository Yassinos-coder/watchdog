import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CHANGELOG_URL,
  FAILURE_CACHE_MS,
  REGISTRY_LATEST_URL,
  REQUEST_TIMEOUT_MS,
  SUCCESS_CACHE_MS,
} from '../constants/update.constants';
import type { UpdateStatus, UpdatesConfig } from '../interfaces/update.interfaces';
import { VersionUtils } from '../utils/version.utils';

@Injectable()
export class UpdateCheckService {
  private readonly logger = new Logger(UpdateCheckService.name);
  private readonly config: UpdatesConfig;
  private cached: { latest: string | null; expiresAt: number } | null = null;

  constructor(configService: ConfigService) {
    this.config = configService.getOrThrow<UpdatesConfig>('updates');
  }

  async getStatus(): Promise<UpdateStatus> {
    const { enabled, currentVersion } = this.config;
    if (!enabled) {
      return this.status(false, currentVersion, null);
    }
    return this.status(true, currentVersion, await this.latestVersion());
  }

  private status(checkEnabled: boolean, currentVersion: string, latest: string | null): UpdateStatus {
    return {
      checkEnabled,
      currentVersion,
      latestVersion: latest,
      updateAvailable: latest !== null && VersionUtils.isNewer(latest, currentVersion),
      changelogUrl: CHANGELOG_URL,
    };
  }

  private async latestVersion(): Promise<string | null> {
    if (this.cached && this.cached.expiresAt > Date.now()) {
      return this.cached.latest;
    }
    const latest = await this.fetchLatest();
    const ttl = latest ? SUCCESS_CACHE_MS : FAILURE_CACHE_MS;
    this.cached = { latest, expiresAt: Date.now() + ttl };
    return latest;
  }

  private async fetchLatest(): Promise<string | null> {
    try {
      const response = await fetch(REGISTRY_LATEST_URL, {
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!response.ok) {
        return null;
      }
      const body = (await response.json()) as { version?: unknown };
      return typeof body.version === 'string' ? body.version : null;
    } catch (error) {
      this.logger.debug(`Update check failed: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }
}
