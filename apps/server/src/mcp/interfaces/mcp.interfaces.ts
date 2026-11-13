export type JsonRpcId = string | number | null;

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: JsonRpcId;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcError {
  code: number;
  message: string;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: JsonRpcId;
  result?: unknown;
  error?: JsonRpcError;
}

export interface McpToolDefinition {
  name: string;
  description: string;
  permission: string;
  inputSchema: Record<string, unknown>;
}

export interface McpTool extends McpToolDefinition {
  run: (args: Record<string, unknown>) => Promise<unknown>;
}

export interface ApiKeyView {
  id: string;
  name: string;
  prefix: string;
  permissions: string[];
  lastUsedAt: Date | null;
  createdAt: Date;
}

export interface CreatedApiKeyView extends ApiKeyView {
  key: string;
}

export interface McpConfigView {
  url: string;
  permissions: { id: string; label: string; description: string; tools: string[]; writes: boolean }[];
  defaults: string[];
}
