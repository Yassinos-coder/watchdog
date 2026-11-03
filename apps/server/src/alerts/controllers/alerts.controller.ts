import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentAuth } from '../../auth/decorators/current-auth.decorator';
import { AuthContext } from '../../auth/interfaces/auth.interfaces';
import { CreateChannelDto, CreateRuleDto, UpdateChannelDto, UpdateRuleDto } from '../dto/alert.dto';
import { ChannelView, DeliveryView, RuleView } from '../interfaces/alert.interfaces';
import { AlertDeliveryRepository } from '../repositories/alert-delivery.repository';
import { AlertChannelsService } from '../services/alert-channels.service';
import { AlertRulesService } from '../services/alert-rules.service';

@Controller()
export class AlertsController {
  constructor(
    private readonly channelsService: AlertChannelsService,
    private readonly rulesService: AlertRulesService,
    private readonly deliveryRepository: AlertDeliveryRepository,
  ) {}

  @Get('alerts/channels')
  listChannels(): Promise<ChannelView[]> {
    return this.channelsService.list();
  }

  @Get('alerts/deliveries')
  listDeliveries(): Promise<DeliveryView[]> {
    return this.deliveryRepository.listRecent();
  }

  @Get('projects/:projectId/alert-rules')
  listRules(@Param('projectId', ParseUUIDPipe) projectId: string): Promise<RuleView[]> {
    return this.rulesService.list(projectId);
  }

  @Post('alerts/channels')
  createChannel(@CurrentAuth() auth: AuthContext, @Body() dto: CreateChannelDto): Promise<ChannelView> {
    return this.channelsService.create(auth.user, dto);
  }

  @Post('alerts/channels/:channelId/test')
  @HttpCode(204)
  sendTest(
    @CurrentAuth() auth: AuthContext,
    @Param('channelId', ParseUUIDPipe) channelId: string,
  ): Promise<void> {
    return this.channelsService.sendTest(auth.user, channelId);
  }

  @Post('projects/:projectId/alert-rules')
  createRule(
    @CurrentAuth() auth: AuthContext,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateRuleDto,
  ): Promise<RuleView> {
    return this.rulesService.create(auth.user, projectId, dto);
  }

  @Patch('alerts/channels/:channelId')
  updateChannel(
    @CurrentAuth() auth: AuthContext,
    @Param('channelId', ParseUUIDPipe) channelId: string,
    @Body() dto: UpdateChannelDto,
  ): Promise<ChannelView> {
    return this.channelsService.update(auth.user, channelId, dto);
  }

  @Patch('alert-rules/:ruleId')
  updateRule(
    @CurrentAuth() auth: AuthContext,
    @Param('ruleId', ParseUUIDPipe) ruleId: string,
    @Body() dto: UpdateRuleDto,
  ): Promise<RuleView> {
    return this.rulesService.update(auth.user, ruleId, dto);
  }

  @Delete('alerts/channels/:channelId')
  @HttpCode(204)
  removeChannel(
    @CurrentAuth() auth: AuthContext,
    @Param('channelId', ParseUUIDPipe) channelId: string,
  ): Promise<void> {
    return this.channelsService.remove(auth.user, channelId);
  }

  @Delete('alert-rules/:ruleId')
  @HttpCode(204)
  removeRule(
    @CurrentAuth() auth: AuthContext,
    @Param('ruleId', ParseUUIDPipe) ruleId: string,
  ): Promise<void> {
    return this.rulesService.remove(auth.user, ruleId);
  }
}
