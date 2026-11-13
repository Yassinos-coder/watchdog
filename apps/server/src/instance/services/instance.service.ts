import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RetentionPolicy } from '../../retention/interfaces/retention.interfaces';
import { InstanceView } from '../interfaces/instance.interfaces';

@Injectable()
export class InstanceService {
  constructor(private readonly configService: ConfigService) {}

  get(): InstanceView {
    return {
      version: this.configService.getOrThrow<string>('updates.currentVersion'),
      appUrl: this.configService.getOrThrow<string>('appUrl'),
      appUrlExplicit: this.configService.getOrThrow<boolean>('appUrlExplicit'),
      updateChecks: this.configService.getOrThrow<boolean>('updates.enabled'),
      retention: this.configService.getOrThrow<RetentionPolicy>('retention'),
      signIn: {
        google: Boolean(this.configService.get<string>('oauth.google.clientId')),
        github: Boolean(this.configService.get<string>('oauth.github.clientId')),
      },
    };
  }
}
