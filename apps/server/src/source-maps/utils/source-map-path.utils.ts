const MAP_SUFFIX = /\.map$/i;
const ORIGIN_PATTERN = /^[a-z][a-z0-9+.-]*:\/\/[^/]+/i;
const FILE_PROTOCOL_PATTERN = /^file:\/\//i;

export class SourceMapPathUtils {
  static normalizeUploadPath(path: string): string {
    return SourceMapPathUtils.clean(path).replace(MAP_SUFFIX, '');
  }

  static candidates(filename: string): string[] {
    const segments = SourceMapPathUtils.clean(filename).split('/').filter(Boolean);
    return segments.map((_, index) => segments.slice(index).join('/'));
  }

  private static clean(path: string): string {
    return path
      .split(/[?#]/)[0]
      .replace(FILE_PROTOCOL_PATTERN, '')
      .replace(ORIGIN_PATTERN, '')
      .replace(/\\/g, '/')
      .replace(/^[a-zA-Z]:/, '')
      .replace(/^(\.\/|~\/|\/)+/, '');
  }
}
