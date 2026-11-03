import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/nest.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'node18',
  splitting: true,
  platform: 'node',
  external: ['@nestjs/common', '@nestjs/core'],
});
