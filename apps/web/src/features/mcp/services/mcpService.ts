import { BaseApiClient } from '@/services/BaseApiClient';
import type { ApiKeyInfo, ApiKeyInput, CreatedApiKey, McpConfig } from '../types/mcp.types';

class McpService extends BaseApiClient {
  getConfig(): Promise<McpConfig> {
    return this.get('/integrations/mcp/config');
  }

  listKeys(): Promise<ApiKeyInfo[]> {
    return this.get('/integrations/mcp/keys');
  }

  createKey(input: ApiKeyInput): Promise<CreatedApiKey> {
    return this.post('/integrations/mcp/keys', input);
  }

  updateKey(keyId: string, input: Partial<ApiKeyInput>): Promise<ApiKeyInfo> {
    return this.patch(`/integrations/mcp/keys/${keyId}`, input);
  }

  removeKey(keyId: string): Promise<void> {
    return this.delete(`/integrations/mcp/keys/${keyId}`);
  }
}

export const mcpService = new McpService();
