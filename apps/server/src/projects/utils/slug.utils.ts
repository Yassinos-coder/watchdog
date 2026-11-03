import { randomBytes } from 'node:crypto';

const MAX_SLUG_LENGTH = 40;

export class SlugUtils {
  static slugify(name: string): string {
    const slug = name
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, MAX_SLUG_LENGTH)
      .replace(/-+$/g, '');
    return slug || 'project';
  }

  static withSuffix(slug: string): string {
    return `${slug}-${randomBytes(2).toString('hex')}`;
  }
}
