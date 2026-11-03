const VERSION_PATTERN = /^(\d+)\.(\d+)\.(\d+)$/;

export class VersionUtils {
  static isNewer(candidate: string, current: string): boolean {
    const next = VersionUtils.parse(candidate);
    const now = VersionUtils.parse(current);
    if (!next || !now) {
      return false;
    }
    for (let index = 0; index < 3; index += 1) {
      if (next[index] !== now[index]) {
        return next[index] > now[index];
      }
    }
    return false;
  }

  private static parse(version: string): number[] | null {
    const match = VERSION_PATTERN.exec(version);
    return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
  }
}
