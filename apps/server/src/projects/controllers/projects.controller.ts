import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentAuth } from '../../auth/decorators/current-auth.decorator';
import { AuthContext } from '../../auth/interfaces/auth.interfaces';
import { CreateKeyDto, CreateProjectDto, UpdateKeyDto, UpdateProjectDto } from '../dto/project.dto';
import {
  CreatedProjectView,
  ProjectKeyView,
  ProjectView,
} from '../interfaces/project.interfaces';
import { ProjectsService } from '../services/projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  list(): Promise<ProjectView[]> {
    return this.projectsService.list();
  }

  @Get(':projectId')
  get(@Param('projectId', ParseUUIDPipe) projectId: string): Promise<ProjectView> {
    return this.projectsService.get(projectId);
  }

  @Post()
  create(@CurrentAuth() auth: AuthContext, @Body() dto: CreateProjectDto): Promise<CreatedProjectView> {
    return this.projectsService.create(auth.user, dto);
  }

  @Post(':projectId/upload-token')
  @HttpCode(200)
  rotateUploadToken(
    @CurrentAuth() auth: AuthContext,
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ): Promise<{ uploadToken: string }> {
    return this.projectsService.rotateUploadToken(auth.user, projectId);
  }

  @Post(':projectId/keys')
  addKey(
    @CurrentAuth() auth: AuthContext,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateKeyDto,
  ): Promise<ProjectKeyView> {
    return this.projectsService.addKey(auth.user, projectId, dto);
  }

  @Patch(':projectId')
  update(
    @CurrentAuth() auth: AuthContext,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: UpdateProjectDto,
  ): Promise<ProjectView> {
    return this.projectsService.update(auth.user, projectId, dto);
  }

  @Patch(':projectId/keys/:keyId')
  @HttpCode(204)
  setKeyActive(
    @CurrentAuth() auth: AuthContext,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('keyId', ParseUUIDPipe) keyId: string,
    @Body() dto: UpdateKeyDto,
  ): Promise<void> {
    return this.projectsService.setKeyActive(auth.user, projectId, keyId, dto.active);
  }

  @Delete(':projectId')
  @HttpCode(204)
  remove(
    @CurrentAuth() auth: AuthContext,
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ): Promise<void> {
    return this.projectsService.remove(auth.user, projectId);
  }

  @Delete(':projectId/keys/:keyId')
  @HttpCode(204)
  removeKey(
    @CurrentAuth() auth: AuthContext,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('keyId', ParseUUIDPipe) keyId: string,
  ): Promise<void> {
    return this.projectsService.removeKey(auth.user, projectId, keyId);
  }
}
