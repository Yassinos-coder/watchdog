import { InstanceRecord } from '../interfaces/lifecycle.interfaces';

const SECOND_MS = 1_000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export class LifecycleUtils {
  static span(ms: number): string {
    if (ms < MINUTE_MS) {
      return `${Math.max(Math.round(ms / SECOND_MS), 1)} s`;
    }
    if (ms < HOUR_MS) {
      return `${Math.round(ms / MINUTE_MS)} min`;
    }
    if (ms < DAY_MS) {
      return `${Math.round(ms / HOUR_MS)} h`;
    }
    return `${Math.round(ms / DAY_MS)} d`;
  }

  static downtimeMs(
    previous: Pick<InstanceRecord, 'stoppedAt'> | null,
    bootedAt: Date,
  ): number | null {
    if (!previous?.stoppedAt) {
      return null;
    }
    const stopped = Date.parse(previous.stoppedAt);
    return Number.isNaN(stopped) ? null : Math.max(bootedAt.getTime() - stopped, 0);
  }

  static withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`Timed out after ${ms} ms`)), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
  }

  static parseRecord(raw: string | null): InstanceRecord | null {
    if (!raw) {
      return null;
    }
    try {
      const value = JSON.parse(raw) as Record<string, unknown>;
      if (typeof value.instanceId !== 'string' || typeof value.bootedAt !== 'string') {
        return null;
      }
      return {
        instanceId: value.instanceId,
        version: typeof value.version === 'string' ? value.version : 'unknown',
        bootedAt: value.bootedAt,
        stoppedAt: typeof value.stoppedAt === 'string' ? value.stoppedAt : null,
      };
    } catch {
      return null;
    }
  }
}
