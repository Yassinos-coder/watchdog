import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RoleValidator } from '../../auth/validators/role.validator';
import type { User } from '../../generated/prisma/client';
import { TokenUtils } from '../../shared/utils/token.utils';
import { CreateKeyDto, CreateProjectDto, UpdateProjectDto } from '../dto/project.dto';
import {
  CreatedProjectView,
  ProjectKeyView,
  ProjectView,
} from '../interfaces/project.interfaces';
import { ProjectMapper } from '../mappers/project.mapper';
import { ProjectRepository } from '../repositories/project.repository';
import { ProjectKeyService } from './project-key.service';
import { SlugUtils } from '../utils/slug.utils';

const PUBLIC_KEY_BYTES = 16;
const UPLOAD_TOKEN_PREFIX = 'wdt_';
const DEFAULT_PLATFORM = 'javascript';
const DEFAULT_KEY_LABEL = 'Default';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly configService: ConfigService,
    private readonly projectKeyService: ProjectKeyService,
  ) {}

  async list(): Promise<ProjectView[]> {
    const projects = await this.projectRepository.findAll();
    return projects.map((project) => ProjectMapper.toView(this.appUrl(), project));
  }

  async get(id: string): Promise<ProjectView> {
    const project = await this.projectRepository.findById(id);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return ProjectMapper.toView(this.appUrl(), project);
  }

  async create(user: User, dto: CreateProjectDto): Promise<CreatedProjectView> {
    RoleValidator.assertAtLeast(user.role, 'ADMIN');
    const uploadToken = this.createUploadToken();
    const project = await this.projectRepository.create({
      name: dto.name.trim(),
      slug: await this.uniqueSlug(dto.name),
      platform: dto.platform?.trim() || DEFAULT_PLATFORM,
      uploadTokenHash: TokenUtils.sha256(uploadToken),
      publicKey: this.createPublicKey(),
    });
    return { ...ProjectMapper.toView(this.appUrl(), project), uploadToken };
  }

  async update(user: User, id: string, dto: UpdateProjectDto): Promise<ProjectView> {
    RoleValidator.assertAtLeast(user.role, 'ADMIN');
    await this.get(id);
    const project = await this.projectRepository.update(id, {
      name: dto.name?.trim(),
      platform: dto.platform?.trim(),
    });
    return ProjectMapper.toView(this.appUrl(), project);
  }

  async remove(user: User, id: string): Promise<void> {
    RoleValidator.assertAtLeast(user.role, 'ADMIN');
    await this.get(id);
    await this.projectRepository.delete(id);
  }

  async rotateUploadToken(user: User, id: string): Promise<{ uploadToken: string }> {
    RoleValidator.assertAtLeast(user.role, 'ADMIN');
    await this.get(id);
    const uploadToken = this.createUploadToken();
    await this.projectRepository.setUploadTokenHash(id, TokenUtils.sha256(uploadToken));
    return { uploadToken };
  }

  async addKey(user: User, projectId: string, dto: CreateKeyDto): Promise<ProjectKeyView> {
    RoleValidator.assertAtLeast(user.role, 'ADMIN');
    await this.get(projectId);
    const key = await this.projectRepository.addKey(
      projectId,
      this.createPublicKey(),
      dto.label?.trim() || DEFAULT_KEY_LABEL,
    );
    return ProjectMapper.toKeyView(this.appUrl(), projectId, key);
  }

  async setKeyActive(
    user: User,
    projectId: string,
    keyId: string,
    active: boolean,
  ): Promise<void> {
    RoleValidator.assertAtLeast(user.role, 'ADMIN');
    const key = await this.requireKey(projectId, keyId);
    await this.projectRepository.setKeyActive(keyId, active);
    this.projectKeyService.forget(key.publicKey);
  }

  async removeKey(user: User, projectId: string, keyId: string): Promise<void> {
    RoleValidator.assertAtLeast(user.role, 'ADMIN');
    const key = await this.requireKey(projectId, keyId);
    if ((await this.projectRepository.countKeys(projectId)) <= 1) {
      throw new BadRequestException('A project needs at least one key');
    }
    await this.projectRepository.deleteKey(keyId);
    this.projectKeyService.forget(key.publicKey);
  }

  private async requireKey(projectId: string, keyId: string) {
    const key = await this.projectRepository.findKey(projectId, keyId);
    if (!key) {
      throw new NotFoundException('Key not found');
    }
    return key;
  }

  private async uniqueSlug(name: string): Promise<string> {
    const slug = SlugUtils.slugify(name);
    return (await this.projectRepository.slugExists(slug)) ? SlugUtils.withSuffix(slug) : slug;
  }

  private createPublicKey(): string {
    return TokenUtils.generate(PUBLIC_KEY_BYTES);
  }

  private createUploadToken(): string {
    return `${UPLOAD_TOKEN_PREFIX}${TokenUtils.generate()}`;
  }

  private appUrl(): string {
    return this.configService.getOrThrow<string>('appUrl');
  }
}
