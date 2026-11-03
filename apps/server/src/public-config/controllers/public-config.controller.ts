import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Public } from '../../auth/decorators/access.decorators';
import { PublicConfig } from '../interfaces/public-config.interfaces';
import { AppVersion } from '../utils/app-version';

@Public()
@Controller('config')
export class PublicConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  get(): PublicConfig {
    return {
      version: AppVersion.read(),
      docsUrl: this.configService.getOrThrow<string>('docs.url'),
      docsExtension: this.configService.getOrThrow<string>('docs.extension'),
    };
  }
}
