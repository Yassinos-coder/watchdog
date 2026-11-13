import { Body, Controller, Delete, Get, Headers, HttpCode, MethodNotAllowedException, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { RateLimit } from 'nestjs-shield';
import { Public } from '../../auth/decorators/access.decorators';
import { MCP_RATE_LIMIT_PER_MINUTE, MINUTE_MS } from '../constants/mcp.constants';
import { JsonRpcResponse } from '../interfaces/mcp.interfaces';
import { McpAuthService } from '../services/mcp-auth.service';
import { McpProtocolService } from '../services/mcp-protocol.service';

@Public()
@Controller('mcp')
export class McpController {
  constructor(
    private readonly authService: McpAuthService,
    private readonly protocolService: McpProtocolService,
  ) {}

  @Post()
  @HttpCode(200)
  @RateLimit({ limit: MCP_RATE_LIMIT_PER_MINUTE, ttl: MINUTE_MS })
  async handle(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: unknown,
    @Res({ passthrough: true }) response: Response,
  ): Promise<JsonRpcResponse | JsonRpcResponse[] | undefined> {
    const key = await this.authService.authenticate(authorization);
    const result = await this.protocolService.handle(body, key.permissions);
    if (result === null) {
      response.status(202);
      return undefined;
    }
    return result;
  }

  @Get()
  stream(): never {
    throw new MethodNotAllowedException('This server answers POST requests only');
  }

  @Delete()
  end(): never {
    throw new MethodNotAllowedException('This server keeps no sessions to end');
  }
}
