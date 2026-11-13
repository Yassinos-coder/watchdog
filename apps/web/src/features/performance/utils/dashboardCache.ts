import type { Dashboard } from '../types/performance.types';

const PREFIX = 'watchdog.dashboards.v1';

interface CachedDashboards {
  data: Dashboard[];
  savedAt: number;
}

export class DashboardCache {
  static read(userId: string | undefined, projectId: string): CachedDashboards | null {
    if (!userId) return null;
    try {
      const raw = window.localStorage.getItem(DashboardCache.key(userId, projectId));
      if (!raw) return null;
      const value = JSON.parse(raw) as CachedDashboards;
      return Array.isArray(value.data) && typeof value.savedAt === 'number' ? value : null;
    } catch {
      return null;
    }
  }

  static write(userId: string | undefined, projectId: string, data: Dashboard[]): void {
    if (!userId) return;
    try {
      const value: CachedDashboards = { data, savedAt: Date.now() };
      window.localStorage.setItem(DashboardCache.key(userId, projectId), JSON.stringify(value));
    } catch {
      return;
    }
  }

  static clear(): void {
    try {
      const keys = Array.from({ length: window.localStorage.length }, (_, index) =>
        window.localStorage.key(index),
      );
      keys.filter((key) => key?.startsWith(PREFIX)).forEach((key) => window.localStorage.removeItem(key!));
    } catch {
      return;
    }
  }

  private static key(userId: string, projectId: string): string {
    return `${PREFIX}.${userId}.${projectId}`;
  }
}
