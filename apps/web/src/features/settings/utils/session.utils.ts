const BROWSERS: [RegExp, string][] = [
  [/Edg\//, 'Edge'],
  [/OPR\//, 'Opera'],
  [/Firefox\//, 'Firefox'],
  [/Chrome\//, 'Chrome'],
  [/Safari\//, 'Safari'],
];

const SYSTEMS: [RegExp, string][] = [
  [/Windows/, 'Windows'],
  [/Android/, 'Android'],
  [/iPhone|iPad|iOS/, 'iOS'],
  [/Mac OS X|Macintosh/, 'macOS'],
  [/Linux/, 'Linux'],
];

export class SessionUtils {
  static describe(userAgent: string | null): string {
    if (!userAgent) return 'Unknown device';
    const browser = BROWSERS.find(([pattern]) => pattern.test(userAgent))?.[1] ?? 'Browser';
    const system = SYSTEMS.find(([pattern]) => pattern.test(userAgent))?.[1];
    return system ? `${browser} on ${system}` : browser;
  }

  static isMobile(userAgent: string | null): boolean {
    return Boolean(userAgent && /Android|iPhone|iPad|Mobile/.test(userAgent));
  }
}
