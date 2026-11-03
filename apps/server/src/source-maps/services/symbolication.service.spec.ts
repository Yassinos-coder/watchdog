import { describe, expect, it, vi } from 'vitest';
import { SourceMapRepository } from '../repositories/source-map.repository';
import { SymbolicationService } from './symbolication.service';

const ORIGINAL_SOURCE = [
  'export function checkout(cart) {',
  '  const total = cart.items.reduce((sum, item) => sum + item.price, 0);',
  '  return total.toFixed(2);',
  '}',
].join('\n');

const SOURCE_MAP = JSON.stringify({
  version: 3,
  file: 'index-abc.js',
  sources: ['../src/checkout.ts'],
  sourcesContent: [ORIGINAL_SOURCE],
  names: ['checkout'],
  mappings: 'AAAA;EACE;EACA',
});

const createService = (findByPaths = vi.fn(), hasRelease = true) => {
  const repository = {
    findRelease: vi.fn().mockResolvedValue(hasRelease ? { id: 'release-1' } : null),
    findByPaths,
  } as unknown as SourceMapRepository;
  return { service: new SymbolicationService(repository), repository };
};

describe('SymbolicationService', () => {
  it('returns frames untouched when the event has no release', async () => {
    const { service, repository } = createService();
    const frames = [{ filename: 'https://x.com/assets/index-abc.js', lineno: 2, colno: 3 }];

    expect(await service.symbolicate('project', undefined, frames)).toBe(frames);
    expect(repository.findRelease).not.toHaveBeenCalled();
  });

  it('returns frames untouched when the release is unknown', async () => {
    const { service } = createService(vi.fn(), false);
    const frames = [{ filename: 'https://x.com/assets/index-abc.js', lineno: 2, colno: 3 }];

    expect(await service.symbolicate('project', '1.0.0', frames)).toEqual(frames);
  });

  it('maps minified positions back to original source with code context', async () => {
    const findByPaths = vi
      .fn()
      .mockResolvedValue([{ filePath: 'assets/index-abc.js', content: Buffer.from(SOURCE_MAP) }]);
    const { service } = createService(findByPaths);

    const [frame] = await service.symbolicate('project', '1.0.0', [
      { filename: 'https://x.com/assets/index-abc.js', function: 'a', lineno: 2, colno: 3 },
    ]);

    expect(frame.symbolicated).toBe(true);
    expect(frame.filename).toBe('src/checkout.ts');
    expect(frame.lineno).toBe(2);
    expect(frame.contextLine).toBe('  const total = cart.items.reduce((sum, item) => sum + item.price, 0);');
    expect(frame.preContext).toEqual(['export function checkout(cart) {']);
    expect(frame.postContext).toEqual(['  return total.toFixed(2);', '}']);
    expect(frame.inApp).toBe(true);
  });

  it('flags frames resolving into node_modules as not in-app', async () => {
    const vendorMap = JSON.stringify({
      version: 3,
      sources: ['../node_modules/lib/index.js'],
      sourcesContent: ['const a = 1;'],
      names: [],
      mappings: 'AAAA',
    });
    const findByPaths = vi
      .fn()
      .mockResolvedValue([{ filePath: 'assets/vendor.js', content: Buffer.from(vendorMap) }]);
    const { service } = createService(findByPaths);

    const [frame] = await service.symbolicate('project', '1.0.0', [
      { filename: 'https://x.com/assets/vendor.js', lineno: 1, colno: 1 },
    ]);

    expect(frame.inApp).toBe(false);
  });

  it('keeps the original frame when no map matches the file', async () => {
    const { service } = createService(vi.fn().mockResolvedValue([]));
    const frames = [{ filename: 'https://x.com/other.js', lineno: 1, colno: 1 }];

    expect(await service.symbolicate('project', '1.0.0', frames)).toEqual(frames);
  });

  it('survives an unreadable source map', async () => {
    const findByPaths = vi
      .fn()
      .mockResolvedValue([{ filePath: 'assets/index-abc.js', content: Buffer.from('not json') }]);
    const { service } = createService(findByPaths);
    const frames = [{ filename: 'https://x.com/assets/index-abc.js', lineno: 2, colno: 3 }];

    expect(await service.symbolicate('project', '1.0.0', frames)).toEqual(frames);
  });

  it('caches parsed maps between frames', async () => {
    const findByPaths = vi
      .fn()
      .mockResolvedValue([{ filePath: 'assets/index-abc.js', content: Buffer.from(SOURCE_MAP) }]);
    const { service } = createService(findByPaths);
    const frame = { filename: 'https://x.com/assets/index-abc.js', lineno: 2, colno: 3 };

    await service.symbolicate('project', '1.0.0', [frame, frame]);

    expect(findByPaths).toHaveBeenCalledTimes(1);
  });
});
