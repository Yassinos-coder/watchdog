export interface UploadOptions {
  directory: string;
  release: string;
  url: string;
  projectId: string;
  token: string;
  dryRun: boolean;
}

export interface MapFile {
  absolutePath: string;
  relativePath: string;
  size: number;
}

export interface UploadSummary {
  uploaded: number;
  batches: number;
  bytes: number;
}

export interface Output {
  log: (message: string) => void;
  error: (message: string) => void;
}
