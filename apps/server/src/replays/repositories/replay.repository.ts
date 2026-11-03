import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { Prisma, Replay } from '../../generated/prisma/client';
import { MAX_ERROR_IDS } from '../constants/replay.constants';
import type { ReplayChunkInput } from '../interfaces/replay.interfaces';

const UNIQUE_VIOLATION = 'P2002';

@Injectable()
export class ReplayRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    projectId: string,
    page: number,
    pageSize: number,
  ): Promise<{ items: Replay[]; total: number }> {
    const where = { projectId };
    const [items, total] = await Promise.all([
      this.prisma.replay.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.replay.count({ where }),
    ]);
    return { items, total };
  }

  findById(id: string): Promise<Replay | null> {
    return this.prisma.replay.findUnique({ where: { id } });
  }

  findByEventId(projectId: string, eventId: string): Promise<Replay | null> {
    return this.prisma.replay.findFirst({
      where: { projectId, errorEventIds: { has: eventId } },
      orderBy: { startedAt: 'desc' },
    });
  }

  async listEvents(id: string): Promise<unknown[]> {
    const chunks = await this.prisma.replayChunk.findMany({
      where: { replayId: id },
      orderBy: { sequence: 'asc' },
      select: { events: true },
    });
    return chunks.flatMap((chunk) => chunk.events as unknown[]);
  }

  async appendChunk(projectId: string, input: ReplayChunkInput): Promise<void> {
    try {
      await this.prisma.$transaction((tx) => this.appendInTransaction(tx, projectId, input));
    } catch (error) {
      if (!this.isUniqueViolation(error)) {
        throw error;
      }
    }
  }

  async remove(id: string): Promise<void> {
    await this.prisma.replay.delete({ where: { id } });
  }

  private async appendInTransaction(
    tx: Prisma.TransactionClient,
    projectId: string,
    input: ReplayChunkInput,
  ): Promise<void> {
    const existing = await tx.replay.findUnique({
      where: { projectId_replayId: { projectId, replayId: input.replayId } },
    });
    const replay =
      existing ??
      (await tx.replay.create({
        data: {
          projectId,
          replayId: input.replayId,
          startedAt: input.startedAt,
          lastEventAt: input.lastEventAt,
          url: input.url,
          userAgent: input.userAgent,
          release: input.release,
          environment: input.environment,
          userId: input.userId,
        },
      }));

    await tx.replayChunk.create({
      data: {
        replayId: replay.id,
        sequence: input.sequence,
        events: input.events as Prisma.InputJsonValue,
      },
    });

    const startedAt = input.startedAt < replay.startedAt ? input.startedAt : replay.startedAt;
    const lastEventAt = input.lastEventAt > replay.lastEventAt ? input.lastEventAt : replay.lastEventAt;
    const errorEventIds = [...new Set([...replay.errorEventIds, ...input.errorEventIds])].slice(
      0,
      MAX_ERROR_IDS,
    );
    await tx.replay.update({
      where: { id: replay.id },
      data: {
        startedAt,
        lastEventAt,
        durationMs: lastEventAt.getTime() - startedAt.getTime(),
        chunkCount: { increment: 1 },
        eventCount: { increment: input.events.length },
        errorEventIds,
      },
    });
  }

  private isUniqueViolation(error: unknown): boolean {
    return (error as { code?: string })?.code === UNIQUE_VIOLATION;
  }
}
