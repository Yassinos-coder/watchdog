const META_EVENT_TYPE = 4;

export class ReplayUtils {
  static duration(ms: number): string {
    const totalSeconds = Math.max(0, Math.round(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }

  static path(url: string | null): string {
    if (!url) return 'Unknown page';
    try {
      const parsed = new URL(url);
      return `${parsed.pathname}${parsed.search}`;
    } catch {
      return url;
    }
  }

  static recordedSize(events: unknown[]): { width: number; height: number } | null {
    const meta = events.find((event) => (event as { type?: number }).type === META_EVENT_TYPE) as { data?: { width?: number; height?: number } } | undefined;
    const width = meta?.data?.width;
    const height = meta?.data?.height;
    return width && height ? { width, height } : null;
  }
}
