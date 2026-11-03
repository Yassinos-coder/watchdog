import { describe, expect, it } from 'vitest';
import { SlugUtils } from './slug.utils';

describe('SlugUtils', () => {
  it('slugifies names', () => {
    expect(SlugUtils.slugify('My Cool App!')).toBe('my-cool-app');
    expect(SlugUtils.slugify('  Café  Müller ')).toBe('cafe-muller');
  });

  it('falls back when nothing usable remains', () => {
    expect(SlugUtils.slugify('!!!')).toBe('project');
  });

  it('caps the length without a trailing dash', () => {
    const slug = SlugUtils.slugify('a'.repeat(39) + ' bbbbbbbb');

    expect(slug.length).toBeLessThanOrEqual(40);
    expect(slug.endsWith('-')).toBe(false);
  });

  it('adds a random suffix for collisions', () => {
    expect(SlugUtils.withSuffix('app')).toMatch(/^app-[0-9a-f]{4}$/);
  });
});
