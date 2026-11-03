import { describe, expect, it } from 'vitest';
import { SourceMapPathUtils } from './source-map-path.utils';

describe('SourceMapPathUtils.normalizeUploadPath', () => {
  it('drops the .map suffix and leading prefixes', () => {
    expect(SourceMapPathUtils.normalizeUploadPath('./assets/index-abc.js.map')).toBe('assets/index-abc.js');
    expect(SourceMapPathUtils.normalizeUploadPath('~/assets/app.js.map')).toBe('assets/app.js');
    expect(SourceMapPathUtils.normalizeUploadPath('/dist/main.js.map')).toBe('dist/main.js');
  });
});

describe('SourceMapPathUtils.candidates', () => {
  it('lists progressively shorter suffixes of a url', () => {
    expect(SourceMapPathUtils.candidates('https://app.example.com/assets/js/index-abc.js?v=1')).toEqual([
      'assets/js/index-abc.js',
      'js/index-abc.js',
      'index-abc.js',
    ]);
  });

  it('handles absolute node paths on posix and windows', () => {
    expect(SourceMapPathUtils.candidates('/app/dist/main.js')).toEqual([
      'app/dist/main.js',
      'dist/main.js',
      'main.js',
    ]);
    expect(SourceMapPathUtils.candidates('C:\\app\\dist\\main.js')).toEqual([
      'app/dist/main.js',
      'dist/main.js',
      'main.js',
    ]);
  });

  it('handles file urls', () => {
    expect(SourceMapPathUtils.candidates('file:///srv/app/dist/server.js')).toEqual([
      'srv/app/dist/server.js',
      'app/dist/server.js',
      'dist/server.js',
      'server.js',
    ]);
  });
});
