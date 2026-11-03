import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { InvitesController } from './controllers/invites.controller';
import { TeamController } from './controllers/team.controller';
import { InviteRepository } from './repositories/invite.repository';
import { InvitesService } from './services/invites.service';
import { TeamService } from './services/team.service';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [TeamController, InvitesController],
  providers: [InviteRepository, InvitesService, TeamService],
  exports: [InviteRepository],
})
export class TeamModule {}
