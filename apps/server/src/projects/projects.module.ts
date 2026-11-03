import { Module } from '@nestjs/common';
import { ProjectsController } from './controllers/projects.controller';
import { ProjectRepository } from './repositories/project.repository';
import { ProjectKeyService } from './services/project-key.service';
import { ProjectsService } from './services/projects.service';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectRepository, ProjectsService, ProjectKeyService],
  exports: [ProjectRepository, ProjectKeyService],
})
export class ProjectsModule {}
