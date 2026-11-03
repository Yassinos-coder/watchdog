import { Injectable, NotFoundException } from '@nestjs/common';
import type { Replay } from '../../generated/prisma/client';
import { ProjectRepository } from '../../projects/repositories/project.repository';
import { DEFAULT_PAGE_SIZE } from '../constants/replay.constants';
import { ReplayListQueryDto } from '../dto/replay.dto';
import type { ReplayEventsView, ReplayPage, ReplayView } from '../interfaces/replay.interfaces';
import { ReplayMapper } from '../mappers/replay.mapper';
import { ReplayRepository } from '../repositories/replay.repository';

@Injectable()
export class ReplaysService {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly replayRepository: ReplayRepository,
  ) {}

  async list(projectId: string, query: ReplayListQueryDto): Promise<ReplayPage> {
    await this.requireProject(projectId);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
    const { items, total } = await this.replayRepository.list(projectId, page, pageSize);
    return { items: items.map(ReplayMapper.toView), total, page, pageSize };
  }

  async findForEvent(projectId: string, eventId: string): Promise<ReplayView | null> {
    await this.requireProject(projectId);
    const replay = await this.replayRepository.findByEventId(projectId, eventId);
    return replay ? ReplayMapper.toView(replay) : null;
  }

  async getEvents(id: string): Promise<ReplayEventsView> {
    const replay = await this.requireReplay(id);
    const events = await this.replayRepository.listEvents(id);
    return { replay: ReplayMapper.toView(replay), events };
  }

  async remove(id: string): Promise<void> {
    await this.requireReplay(id);
    await this.replayRepository.remove(id);
  }

  private async requireProject(projectId: string): Promise<void> {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
  }

  private async requireReplay(id: string): Promise<Replay> {
    const replay = await this.replayRepository.findById(id);
    if (!replay) {
      throw new NotFoundException('Replay not found');
    }
    return replay;
  }
}
