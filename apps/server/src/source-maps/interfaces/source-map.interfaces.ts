import type { TraceMap } from '@jridgewell/trace-mapping';

export interface LoadedSourceMap {
  trace: TraceMap;
}

export interface UploadedFile {
  originalname: string;
  buffer: Buffer;
}

export interface UploadResult {
  release: string;
  stored: number;
}

export interface ReleaseView {
  id: string;
  version: string;
  createdAt: Date;
  sourceMapCount: number;
}
