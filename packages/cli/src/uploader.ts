import { readFile } from 'node:fs/promises';
import { MapFile, Output, UploadOptions, UploadSummary } from './interfaces';

const MAX_FILES_PER_BATCH = 20;
const MAX_BYTES_PER_BATCH = 40 * 1024 * 1024;

export class SourceMapUploader {
  constructor(
    private readonly options: UploadOptions,
    private readonly output: Output,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async upload(files: MapFile[]): Promise<UploadSummary> {
    const batches = SourceMapUploader.batch(files);
    let uploaded = 0;
    for (const [index, batch] of batches.entries()) {
      await this.send(batch);
      uploaded += batch.length;
      this.output.log(`Uploaded batch ${index + 1}/${batches.length} (${batch.length} files)`);
    }
    return { uploaded, batches: batches.length, bytes: files.reduce((sum, file) => sum + file.size, 0) };
  }

  static batch(files: MapFile[]): MapFile[][] {
    const batches: MapFile[][] = [];
    let current: MapFile[] = [];
    let currentBytes = 0;
    for (const file of files) {
      const full =
        current.length >= MAX_FILES_PER_BATCH || (current.length > 0 && currentBytes + file.size > MAX_BYTES_PER_BATCH);
      if (full) {
        batches.push(current);
        current = [];
        currentBytes = 0;
      }
      current.push(file);
      currentBytes += file.size;
    }
    if (current.length > 0) {
      batches.push(current);
    }
    return batches;
  }

  private async send(batch: MapFile[]): Promise<void> {
    const form = new FormData();
    for (const file of batch) {
      const content = await readFile(file.absolutePath);
      form.append('files', new Blob([new Uint8Array(content)], { type: 'application/json' }), file.relativePath);
    }
    const { url, projectId, release, token } = this.options;
    const response = await this.fetchImpl(
      `${url}/api/projects/${projectId}/releases/${encodeURIComponent(release)}/sourcemaps`,
      { method: 'POST', headers: { authorization: `Bearer ${token}` }, body: form },
    );
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`Upload failed with status ${response.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`);
    }
  }
}
