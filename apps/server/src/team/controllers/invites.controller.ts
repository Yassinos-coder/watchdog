import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { RateLimit } from 'nestjs-shield';
import { Public } from '../../auth/decorators/access.decorators';
import { CurrentAuth } from '../../auth/decorators/current-auth.decorator';
import { AuthContext, AuthResponse } from '../../auth/interfaces/auth.interfaces';
import { SessionMetaMapper } from '../../auth/mappers/session-meta.mapper';
import { SessionService } from '../../auth/services/session.service';
import { AcceptInviteDto, CreateInviteDto } from '../dto/team.dto';
import type { CreatedInviteView, InvitePreview, InviteView } from '../interfaces/team.interfaces';
import { InvitesService } from '../services/invites.service';

const INVITE_LIMIT = { limit: 20, ttl: 60_000 };

@Controller('invites')
export class InvitesController {
  constructor(
    private readonly invitesService: InvitesService,
    private readonly sessionService: SessionService,
  ) {}

  @Get()
  list(@CurrentAuth() auth: AuthContext): Promise<InviteView[]> {
    return this.invitesService.list(auth.user);
  }

  @Public()
  @RateLimit(INVITE_LIMIT)
  @Get('preview/:token')
  preview(@Param('token') token: string): Promise<InvitePreview> {
    return this.invitesService.preview(token);
  }

  @Post()
  create(@CurrentAuth() auth: AuthContext, @Body() dto: CreateInviteDto): Promise<CreatedInviteView> {
    return this.invitesService.create(auth.user, dto);
  }

  @Public()
  @RateLimit(INVITE_LIMIT)
  @HttpCode(200)
  @Post('accept')
  async accept(
    @Body() dto: AcceptInviteDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponse> {
    const outcome = await this.invitesService.accept(dto, SessionMetaMapper.fromRequest(request));
    this.sessionService.attach(response, outcome.session);
    return outcome.body;
  }

  @Delete(':inviteId')
  @HttpCode(204)
  revoke(
    @CurrentAuth() auth: AuthContext,
    @Param('inviteId', ParseUUIDPipe) inviteId: string,
  ): Promise<void> {
    return this.invitesService.revoke(auth.user, inviteId);
  }
}
