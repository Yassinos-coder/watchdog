import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  JSON_RPC_ERRORS,
  MAX_TOOL_RESULT_CHARS,
  MCP_PROTOCOL_VERSIONS,
  MCP_SERVER_NAME,
} from '../constants/mcp.constants';
import { JsonRpcRequest, JsonRpcResponse } from '../interfaces/mcp.interfaces';
import { McpToolError } from '../validators/mcp-args.validator';
import { McpToolsService } from './mcp-tools.service';

@Injectable()
export class McpProtocolService {
  private readonly logger = new Logger(McpProtocolService.name);

  constructor(
    private readonly toolsService: McpToolsService,
    private readonly configService: ConfigService,
  ) {}

  async handle(body: unknown, permissions: string[]): Promise<JsonRpcResponse | JsonRpcResponse[] | null> {
    if (Array.isArray(body)) {
      const responses = (await Promise.all(body.map((entry) => this.handleOne(entry, permissions)))).filter(
        (response): response is JsonRpcResponse => response !== null,
      );
      return responses.length > 0 ? responses : null;
    }
    return this.handleOne(body, permissions);
  }

  private async handleOne(message: unknown, permissions: string[]): Promise<JsonRpcResponse | null> {
    if (!this.isRequest(message)) {
      return this.failure(null, JSON_RPC_ERRORS.INVALID_REQUEST, 'Not a JSON-RPC 2.0 request');
    }
    const isNotification = message.id === undefined;
    try {
      const result = await this.dispatch(message, permissions);
      return isNotification ? null : { jsonrpc: '2.0', id: message.id ?? null, result };
    } catch (error) {
      if (isNotification) {
        return null;
      }
      return this.toFailure(message.id ?? null, error);
    }
  }

  private async dispatch(message: JsonRpcRequest, permissions: string[]): Promise<unknown> {
    switch (message.method) {
      case 'initialize':
        return this.initialize(message.params ?? {});
      case 'ping':
      case 'notifications/initialized':
      case 'notifications/cancelled':
        return {};
      case 'tools/list':
        return { tools: this.toolsService.list(permissions).map(({ permission: _permission, ...tool }) => tool) };
      case 'tools/call':
        return this.callTool(message.params ?? {}, permissions);
      default:
        throw new McpMethodError(JSON_RPC_ERRORS.METHOD_NOT_FOUND, `Unknown method ${message.method}`);
    }
  }

  private initialize(params: Record<string, unknown>): unknown {
    const requested = typeof params.protocolVersion === 'string' ? params.protocolVersion : '';
    const supported = (MCP_PROTOCOL_VERSIONS as readonly string[]).includes(requested);
    return {
      protocolVersion: supported ? requested : MCP_PROTOCOL_VERSIONS[0],
      capabilities: { tools: { listChanged: false } },
      serverInfo: {
        name: MCP_SERVER_NAME,
        version: this.configService.getOrThrow<string>('updates.currentVersion'),
      },
      instructions:
        'Watchdog tracks errors, performance and metrics for your apps. Start with list_projects, then read issues, stats and series for a project.',
    };
  }

  private async callTool(params: Record<string, unknown>, permissions: string[]): Promise<unknown> {
    const name = typeof params.name === 'string' ? params.name : '';
    const tool = this.toolsService.find(name);
    if (!tool) {
      throw new McpMethodError(JSON_RPC_ERRORS.INVALID_PARAMS, `Unknown tool ${name}`);
    }
    if (!permissions.includes(tool.permission)) {
      return this.toolResult(`This API key is not allowed to use ${name}. Ask an admin to enable "${tool.permission}".`, true);
    }
    const args = typeof params.arguments === 'object' && params.arguments !== null ? (params.arguments as Record<string, unknown>) : {};
    try {
      return this.toolResult(JSON.stringify(await tool.run(args), null, 2), false);
    } catch (error) {
      if (error instanceof McpToolError || error instanceof HttpException) {
        return this.toolResult(error.message, true);
      }
      this.logger.error(`Tool ${name} failed: ${error instanceof Error ? error.message : String(error)}`);
      return this.toolResult('The tool failed. Try again in a moment.', true);
    }
  }

  private toolResult(text: string, isError: boolean): unknown {
    const clipped = text.length > MAX_TOOL_RESULT_CHARS ? `${text.slice(0, MAX_TOOL_RESULT_CHARS)}\n… (shortened)` : text;
    return { content: [{ type: 'text', text: clipped }], isError };
  }

  private toFailure(id: JsonRpcResponse['id'], error: unknown): JsonRpcResponse {
    if (error instanceof McpMethodError) {
      return this.failure(id, error.code, error.message);
    }
    this.logger.error(error instanceof Error ? error.message : String(error));
    return this.failure(id, JSON_RPC_ERRORS.INTERNAL, 'Internal error');
  }

  private failure(id: JsonRpcResponse['id'], code: number, message: string): JsonRpcResponse {
    return { jsonrpc: '2.0', id, error: { code, message } };
  }

  private isRequest(message: unknown): message is JsonRpcRequest {
    return (
      typeof message === 'object' &&
      message !== null &&
      (message as JsonRpcRequest).jsonrpc === '2.0' &&
      typeof (message as JsonRpcRequest).method === 'string'
    );
  }
}

class McpMethodError extends Error {
  constructor(
    readonly code: number,
    message: string,
  ) {
    super(message);
  }
}
