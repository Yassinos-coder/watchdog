import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PROJECT_KEY_CACHE_TTL_MS } from '../constants/project.constants';
import { ResolvedProjectKey } from '../interfaces/project.interfaces';
import { ProjectRepository } from '../repositories/project.repository';

interface CachedKey extends ResolvedProjectKey {
  expiresAt: number;
}

@Injectable()
export class ProjectKeyService {
  private readonly cache = new Map<string, CachedKey>();

  constructor(private readonly projectRepository: ProjectRepository) {}

  async assertValid(publicKey: string | undefined, projectId: string): Promise<void> {
    const resolved = publicKey ? await this.resolve(publicKey) : null;
    if (!resolved || !resolved.active || resolved.projectId !== projectId) {
      throw new UnauthorizedException('Invalid project key');
    }
  }

  forget(publicKey: string): void {
    this.cache.delete(publicKey);
  }

  private async resolve(publicKey: string): Promise<ResolvedProjectKey | null> {
    const cached = this.cache.get(publicKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached;
    }
    const key = await this.projectRepository.findKeyByPublicKey(publicKey);
    if (!key) {
      this.cache.delete(publicKey);
      return null;
    }
    const resolved = { projectId: key.projectId, active: key.active };
    this.cache.set(publicKey, { ...resolved, expiresAt: Date.now() + PROJECT_KEY_CACHE_TTL_MS });
    return resolved;
  }
}
