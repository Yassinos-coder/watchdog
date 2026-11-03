import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { Prisma } from '../../generated/prisma/client';
import { IngestResult, RecordEventInput } from '../interfaces/ingest.interfaces';

const UNIQUE_VIOLATION = 'P2002';

@Injectable()
export class IngestRepository {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: RecordEventInput): Promise<IngestResult> {
    try {
      return await this.prisma.$transaction((tx) => this.recordInTransaction(tx, input));
    } catch (error) {
      if (!this.isUniqueViolation(error)) {
        throw error;
      }
      return this.findDuplicate(input);
    }
  }

  private async recordInTransaction(
    tx: Prisma.TransactionClient,
    { projectId, event, fingerprint, title, culprit }: RecordEventInput,
  ): Promise<IngestResult> {
    const existing = await tx.event.findUnique({
      where: { projectId_eventId: { projectId, eventId: event.eventId } },
      select: { issueId: true },
    });
    if (existing) {
      return this.duplicateResult(event.eventId, existing.issueId);
    }

    const issue = await tx.issue.upsert({
      where: { projectId_fingerprint: { projectId, fingerprint } },
      create: {
        projectId,
        fingerprint,
        title,
        culprit,
        level: event.level,
        platform: event.platform,
        firstSeen: event.timestamp,
        lastSeen: event.timestamp,
        firstRelease: event.release,
        lastRelease: event.release,
      },
      update: {
        eventCount: { increment: 1 },
        lastSeen: event.timestamp,
        ...(event.release ? { lastRelease: event.release } : {}),
      },
    });

    const regression = await tx.issue.updateMany({
      where: { id: issue.id, status: 'RESOLVED' },
      data: { status: 'UNRESOLVED', regressedAt: new Date() },
    });

    await tx.event.create({
      data: {
        eventId: event.eventId,
        projectId,
        issueId: issue.id,
        timestamp: event.timestamp,
        level: event.level,
        message: event.message,
        release: event.release,
        environment: event.environment,
        platform: event.platform,
        payload: this.toPayload(event) as Prisma.InputJsonValue,
      },
    });

    return {
      eventId: event.eventId,
      issueId: issue.id,
      isNewIssue: issue.eventCount === 1,
      isRegression: regression.count > 0,
      duplicate: false,
    };
  }

  private async findDuplicate({ projectId, event }: RecordEventInput): Promise<IngestResult> {
    const existing = await this.prisma.event.findUniqueOrThrow({
      where: { projectId_eventId: { projectId, eventId: event.eventId } },
      select: { issueId: true },
    });
    return this.duplicateResult(event.eventId, existing.issueId);
  }

  private duplicateResult(eventId: string, issueId: string): IngestResult {
    return { eventId, issueId, isNewIssue: false, isRegression: false, duplicate: true };
  }

  private toPayload(event: RecordEventInput['event']): Record<string, unknown> {
    return {
      exception: event.exception,
      breadcrumbs: event.breadcrumbs,
      user: event.user,
      tags: event.tags,
      extra: event.extra,
      request: event.request,
      contexts: event.contexts,
      sdk: event.sdk,
    };
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: unknown }).code === UNIQUE_VIOLATION
    );
  }
}
