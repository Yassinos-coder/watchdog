import { BaseApiClient } from './BaseApiClient';

export interface PublicConfig {
  version: string;
  docsUrl: string;
  docsExtension: string;
}

class ConfigService extends BaseApiClient {
  load(): Promise<PublicConfig> {
    return this.get('/config');
  }
}

export const configService = new ConfigService();
