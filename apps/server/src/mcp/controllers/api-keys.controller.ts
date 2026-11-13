import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { CurrentAuth } from '../../auth/decorators/current-auth.decorator';
import { AuthContext } from '../../auth/interfaces/auth.interfaces';
import { CreateApiKeyDto, UpdateApiKeyDto } from '../dto/api-key.dto';
import { ApiKeyView, CreatedApiKeyView, McpConfigView } from '../interfaces/mcp.interfaces';
import { ApiKeysService } from '../services/api-keys.service';

@Controller('integrations/mcp')
export class ApiKeysController {
  constructor(private readonly keysService: ApiKeysService) {}

  @Get('config')
  config(): McpConfigView {
    return this.keysService.getConfig();
  }

  @Get('keys')
  list(): Promise<ApiKeyView[]> {
    return this.keysService.list();
  }

  @Post('keys')
  create(@CurrentAuth() auth: AuthContext, @Body() dto: CreateApiKeyDto): Promise<CreatedApiKeyView> {
    return this.keysService.create(auth.user, dto);
  }

  @Patch('keys/:keyId')
  update(
    @CurrentAuth() auth: AuthContext,
    @Param('keyId', ParseUUIDPipe) keyId: string,
    @Body() dto: UpdateApiKeyDto,
  ): Promise<ApiKeyView> {
    return this.keysService.update(auth.user, keyId, dto);
  }

  @Delete('keys/:keyId')
  @HttpCode(204)
  remove(@CurrentAuth() auth: AuthContext, @Param('keyId', ParseUUIDPipe) keyId: string): Promise<void> {
    return this.keysService.remove(auth.user, keyId);
  }
}
