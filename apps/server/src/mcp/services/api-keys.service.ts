import { createHash, randomBytes } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RoleValidator } from '../../auth/validators/role.validator';
import type { User } from '../../generated/prisma/client';
import {
  API_KEY_PREFIX,
  API_KEY_PREFIX_SHOWN,
  DEFAULT_PERMISSIONS,
  MAX_API_KEYS,
  MCP_PERMISSIONS,
} from '../constants/mcp.constants';
import { CreateApiKeyDto, UpdateApiKeyDto } from '../dto/api-key.dto';
import { ApiKeyView, CreatedApiKeyView, McpConfigView } from '../interfaces/mcp.interfaces';
import { ApiKeyMapper } from '../mappers/api-key.mapper';
import { ApiKeyRepository } from '../repositories/api-key.repository';

@Injectable()
export class ApiKeysService {
  constructor(
    private readonly keyRepository: ApiKeyRepository,
    private readonly configService: ConfigService,
  ) {}

  getConfig(): McpConfigView {
    const appUrl = this.configService.getOrThrow<string>('appUrl');
    const apiPrefix = this.configService.getOrThrow<string>('apiPrefix');
    return {
      url: `${appUrl}/${apiPrefix}/mcp`,
      permissions: MCP_PERMISSIONS,
      defaults: DEFAULT_PERMISSIONS,
    };
  }

  async list(): Promise<ApiKeyView[]> {
    return (await this.keyRepository.findAll()).map(ApiKeyMapper.toView);
  }

  async create(user: User, dto: CreateApiKeyDto): Promise<CreatedApiKeyView> {
    RoleValidator.assertAtLeast(user.role, 'ADMIN');
    if ((await this.keyRepository.count()) >= MAX_API_KEYS) {
      throw new BadRequestException(`You can have at most ${MAX_API_KEYS} API keys`);
    }
    const key = `${API_KEY_PREFIX}${randomBytes(32).toString('base64url')}`;
    const created = await this.keyRepository.create({
      name: dto.name.trim(),
      prefix: key.slice(0, API_KEY_PREFIX_SHOWN),
      keyHash: ApiKeysService.hash(key),
      permissions: dto.permissions,
      createdById: user.id,
    });
    return { ...ApiKeyMapper.toView(created), key };
  }

  async update(user: User, id: string, dto: UpdateApiKeyDto): Promise<ApiKeyView> {
    RoleValidator.assertAtLeast(user.role, 'ADMIN');
    await this.require(id);
    const updated = await this.keyRepository.update(id, {
      name: dto.name?.trim(),
      permissions: dto.permissions,
    });
    return ApiKeyMapper.toView(updated);
  }

  async remove(user: User, id: string): Promise<void> {
    RoleValidator.assertAtLeast(user.role, 'ADMIN');
    await this.require(id);
    await this.keyRepository.delete(id);
  }

  static hash(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }

  private async require(id: string): Promise<void> {
    if (!(await this.keyRepository.findById(id))) {
      throw new NotFoundException('API key not found');
    }
  }
}
