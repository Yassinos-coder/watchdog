import { InternalServerErrorException } from '@nestjs/common';

const MIN_SECRET_KEY_LENGTH = 32;

export class EnvironmentValidator {
  static validate(config: Record<string, unknown>): Record<string, unknown> {
    const problems: string[] = [];

    if (!config.DATABASE_URL) {
      problems.push('DATABASE_URL is required');
    }
    const secretKey = config.WATCHDOG_SECRET_KEY;
    if (typeof secretKey !== 'string' || secretKey.length < MIN_SECRET_KEY_LENGTH) {
      problems.push(
        `WATCHDOG_SECRET_KEY is required and must be at least ${MIN_SECRET_KEY_LENGTH} characters (generate one with: openssl rand -hex 32)`,
      );
    }

    if (problems.length > 0) {
      throw new InternalServerErrorException(`Invalid configuration:\n- ${problems.join('\n- ')}`);
    }
    return config;
  }
}
