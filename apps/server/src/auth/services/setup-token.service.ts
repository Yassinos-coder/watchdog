import { ForbiddenException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '../../users/repositories/user.repository';
import { TokenUtils } from '../../shared/utils/token.utils';

@Injectable()
export class SetupTokenService implements OnModuleInit {
  private readonly logger = new Logger(SetupTokenService.name);
  private token: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
  ) {
    this.token =
      this.configService.get<string | undefined>('security.setupToken') ?? TokenUtils.generate(18);
  }

  async onModuleInit(): Promise<void> {
    if (this.configService.get<string | undefined>('security.setupToken')) {
      return;
    }
    if ((await this.userRepository.count()) > 0) {
      return;
    }
    this.logger.warn(`First-run setup token (set SETUP_TOKEN to choose your own): ${this.token}`);
  }

  assertValid(candidate: string): void {
    if (!TokenUtils.safeEqual(candidate, this.token)) {
      throw new ForbiddenException('Invalid setup token');
    }
  }
}
