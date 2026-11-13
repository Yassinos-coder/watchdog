import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { CurrentAuth } from '../decorators/current-auth.decorator';
import { ChangeEmailDto, ChangePasswordDto, UpdateProfileDto } from '../dto/profile.dto';
import { AuthContext, AuthUserView, SessionView } from '../interfaces/auth.interfaces';
import { ProfileService } from '../services/profile.service';

@Controller('auth')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Patch('profile')
  updateName(@CurrentAuth() auth: AuthContext, @Body() dto: UpdateProfileDto): Promise<AuthUserView> {
    return this.profileService.updateName(auth.user, dto);
  }

  @Post('profile/email')
  @HttpCode(200)
  changeEmail(@CurrentAuth() auth: AuthContext, @Body() dto: ChangeEmailDto): Promise<AuthUserView> {
    return this.profileService.changeEmail(auth.user, dto);
  }

  @Post('profile/password')
  @HttpCode(204)
  changePassword(@CurrentAuth() auth: AuthContext, @Body() dto: ChangePasswordDto): Promise<void> {
    return this.profileService.changePassword(auth.user, auth.session.id, dto);
  }

  @Get('sessions')
  listSessions(@CurrentAuth() auth: AuthContext): Promise<SessionView[]> {
    return this.profileService.listSessions(auth.user, auth.session.id);
  }

  @Delete('sessions')
  @HttpCode(204)
  revokeOthers(@CurrentAuth() auth: AuthContext): Promise<void> {
    return this.profileService.revokeOtherSessions(auth.user, auth.session.id);
  }

  @Delete('sessions/:sessionId')
  @HttpCode(204)
  revoke(
    @CurrentAuth() auth: AuthContext,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ): Promise<void> {
    return this.profileService.revokeSession(auth.user, auth.session.id, sessionId);
  }
}
