export class UrlUtils {
  static withoutQuery(url: string): string {
    try {
      const parsed = new URL(url, globalThis.location?.href);
      return `${parsed.origin}${parsed.pathname}`;
    } catch {
      return url.split(/[?#]/)[0];
    }
  }

  static pathOnly(url: string): string {
    try {
      return new URL(url, globalThis.location?.href).pathname;
    } catch {
      return url;
    }
  }
}
