import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { CurrentAuth } from '../../auth/decorators/current-auth.decorator';
import { AuthContext } from '../../auth/interfaces/auth.interfaces';
import { CreateWebhookDto, UpdateWebhookDto } from '../dto/webhook.dto';
import {
  CreatedWebhookView,
  WebhookConfigView,
  WebhookDeliveryView,
  WebhookView,
} from '../interfaces/webhook.interfaces';
import { WebhooksService } from '../services/webhooks.service';

@Controller('integrations/webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get('config')
  config(): WebhookConfigView {
    return this.webhooksService.getConfig();
  }

  @Get()
  list(): Promise<WebhookView[]> {
    return this.webhooksService.list();
  }

  @Get(':webhookId/deliveries')
  deliveries(@Param('webhookId', ParseUUIDPipe) webhookId: string): Promise<WebhookDeliveryView[]> {
    return this.webhooksService.deliveries(webhookId);
  }

  @Post()
  create(@CurrentAuth() auth: AuthContext, @Body() dto: CreateWebhookDto): Promise<CreatedWebhookView> {
    return this.webhooksService.create(auth.user, dto);
  }

  @Post(':webhookId/test')
  @HttpCode(200)
  test(
    @CurrentAuth() auth: AuthContext,
    @Param('webhookId', ParseUUIDPipe) webhookId: string,
  ): Promise<WebhookDeliveryView> {
    return this.webhooksService.sendTest(auth.user, webhookId);
  }

  @Post(':webhookId/rotate-secret')
  @HttpCode(200)
  rotateSecret(
    @CurrentAuth() auth: AuthContext,
    @Param('webhookId', ParseUUIDPipe) webhookId: string,
  ): Promise<{ secret: string }> {
    return this.webhooksService.rotateSecret(auth.user, webhookId);
  }

  @Patch(':webhookId')
  update(
    @CurrentAuth() auth: AuthContext,
    @Param('webhookId', ParseUUIDPipe) webhookId: string,
    @Body() dto: UpdateWebhookDto,
  ): Promise<WebhookView> {
    return this.webhooksService.update(auth.user, webhookId, dto);
  }

  @Delete(':webhookId')
  @HttpCode(204)
  remove(@CurrentAuth() auth: AuthContext, @Param('webhookId', ParseUUIDPipe) webhookId: string): Promise<void> {
    return this.webhooksService.remove(auth.user, webhookId);
  }
}
