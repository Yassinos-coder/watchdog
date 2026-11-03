import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TeamModule } from '../team/team.module';
import { UsersModule } from '../users/users.module';
import { OAuthController } from './controllers/oauth.controller';
import { OAuthProfileService } from './services/oauth-profile.service';
import { OAuthService } from './services/oauth.service';

@Module({
  imports: [AuthModule, UsersModule, TeamModule],
  controllers: [OAuthController],
  providers: [OAuthProfileService, OAuthService],
})
export class OAuthModule {}
