import type { ShieldConfig } from 'nestjs-shield';

export class ShieldOptionsFactory {
  static fromEnvironment(env: NodeJS.ProcessEnv = process.env): ShieldConfig {
    const entries = (env.SHIELD_WHITELIST ?? '')
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
    if (entries.length === 0) {
      return {};
    }
    return {
      whitelist: {
        ips: entries.filter((entry) => !entry.includes('/')),
        cidrs: entries.filter((entry) => entry.includes('/')),
      },
    };
  }
}
