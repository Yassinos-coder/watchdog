import type { ApiKey } from '../../generated/prisma/client';
import { ApiKeyView } from '../interfaces/mcp.interfaces';

export class ApiKeyMapper {
  static toView(key: ApiKey): ApiKeyView {
    return {
      id: key.id,
      name: key.name,
      prefix: key.prefix,
      permissions: key.permissions,
      lastUsedAt: key.lastUsedAt,
      createdAt: key.createdAt,
    };
  }
}
