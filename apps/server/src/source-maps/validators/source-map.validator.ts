import { BadRequestException } from '@nestjs/common';

const VERSION_PATTERN = /^[\w.\-+@/]{1,200}$/;

export class SourceMapValidator {
  static assertVersion(version: string): void {
    if (!VERSION_PATTERN.test(version)) {
      throw new BadRequestException('Invalid release version');
    }
  }

  static assertSourceMap(name: string, content: Buffer): void {
    try {
      const parsed: unknown = JSON.parse(content.toString('utf8'));
      const isMap =
        typeof parsed === 'object' &&
        parsed !== null &&
        'mappings' in parsed &&
        typeof (parsed as { mappings: unknown }).mappings === 'string';
      if (isMap) {
        return;
      }
    } catch {
      throw new BadRequestException(`${name} is not valid JSON`);
    }
    throw new BadRequestException(`${name} is not a source map`);
  }
}
