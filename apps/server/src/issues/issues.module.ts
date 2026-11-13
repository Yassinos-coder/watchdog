import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/projects.module';
import { IssuesController } from './controllers/issues.controller';
import { IssueRepository } from './repositories/issue.repository';
import { IssuesService } from './services/issues.service';

@Module({
  imports: [ProjectsModule],
  controllers: [IssuesController],
  providers: [IssueRepository, IssuesService],
  exports: [IssuesService],
})
export class IssuesModule {}
