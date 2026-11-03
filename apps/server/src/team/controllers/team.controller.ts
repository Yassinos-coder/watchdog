import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { CurrentAuth } from '../../auth/decorators/current-auth.decorator';
import { AuthContext } from '../../auth/interfaces/auth.interfaces';
import { UpdateMemberRoleDto } from '../dto/team.dto';
import type { TeamMemberView } from '../interfaces/team.interfaces';
import { TeamService } from '../services/team.service';

@Controller('team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get()
  list(@CurrentAuth() auth: AuthContext): Promise<TeamMemberView[]> {
    return this.teamService.list(auth.user);
  }

  @Patch(':userId')
  changeRole(
    @CurrentAuth() auth: AuthContext,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateMemberRoleDto,
  ): Promise<TeamMemberView> {
    return this.teamService.changeRole(auth.user, userId, dto.role);
  }

  @Delete(':userId')
  @HttpCode(204)
  remove(
    @CurrentAuth() auth: AuthContext,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    return this.teamService.remove(auth.user, userId);
  }
}
