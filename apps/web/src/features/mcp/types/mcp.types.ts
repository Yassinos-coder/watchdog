export interface ApiKeyInfo {
  id: string;
  name: string;
  prefix: string;
  permissions: string[];
  lastUsedAt: string | null;
  createdAt: string;
}

export interface CreatedApiKey extends ApiKeyInfo {
  key: string;
}

export interface McpPermission {
  id: string;
  label: string;
  description: string;
  tools: string[];
  writes: boolean;
}

export interface McpConfig {
  url: string;
  permissions: McpPermission[];
  defaults: string[];
}

export interface ApiKeyInput {
  name: string;
  permissions: string[];
}
