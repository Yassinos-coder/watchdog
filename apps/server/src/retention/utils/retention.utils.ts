const DAY_MS = 86_400_000;

export class RetentionUtils {
  static cutoff(days: number, now = Date.now()): Date | null {
    if (!Number.isFinite(days) || days <= 0) {
      return null;
    }
    return new Date(now - days * DAY_MS);
  }
}
