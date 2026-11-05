import { BadRequestException } from '@nestjs/common';
import { AppUrlMismatch } from '../interfaces/auth.interfaces';

export class AppHostValidator {
  static findMismatch(requestOrigin: string, appUrl: string): AppUrlMismatch | null {
    const requested = AppHostValidator.parse(requestOrigin);
    const configured = AppHostValidator.parse(appUrl);
    if (!requested || !configured) {
      return null;
    }
    if (requested.hostname === configured.hostname) {
      return null;
    }
    return { host: requested.host, configuredUrl: configured.origin, expectedUrl: requested.origin };
  }

  static assertMatches(requestOrigin: string, appUrl: string): void {
    const mismatch = AppHostValidator.findMismatch(requestOrigin, appUrl);
    if (!mismatch) {
      return;
    }
    throw new BadRequestException(
      `Passkeys are bound to ${new URL(mismatch.configuredUrl).hostname} (from APP_URL), but Watchdog is open on ${mismatch.host}. Set APP_URL to ${mismatch.expectedUrl}, redeploy, then try again.`,
    );
  }

  static describe(mismatch: AppUrlMismatch): string {
    return `Watchdog is open on ${mismatch.host} but APP_URL is ${mismatch.configuredUrl}. Passkeys will fail until APP_URL is set to ${mismatch.expectedUrl}.`;
  }

  private static parse(value: string): URL | null {
    try {
      return new URL(value);
    } catch {
      return null;
    }
  }
}
