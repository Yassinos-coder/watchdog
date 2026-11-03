import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ProjectRepository } from '../../projects/repositories/project.repository';
import { TokenUtils } from '../../shared/utils/token.utils';
import { ReleaseView, UploadedFile, UploadResult } from '../interfaces/source-map.interfaces';
import { SourceMapRepository } from '../repositories/source-map.repository';
import { SourceMapPathUtils } from '../utils/source-map-path.utils';
import { SourceMapValidator } from '../validators/source-map.validator';

@Injectable()
export class SourceMapsService {
  constructor(
    private readonly sourceMapRepository: SourceMapRepository,
    private readonly projectRepository: ProjectRepository,
  ) {}

  listReleases(projectId: string): Promise<ReleaseView[]> {
    return this.sourceMapRepository.listReleases(projectId);
  }

  async upload(
    projectId: string,
    version: string,
    bearerToken: string | undefined,
    files: UploadedFile[],
  ): Promise<UploadResult> {
    await this.assertUploadToken(projectId, bearerToken);
    SourceMapValidator.assertVersion(version);
    if (files.length === 0) {
      throw new BadRequestException('No source map files were uploaded');
    }
    const release = await this.sourceMapRepository.ensureRelease(projectId, version);
    for (const file of files) {
      SourceMapValidator.assertSourceMap(file.originalname, file.buffer);
      await this.sourceMapRepository.save(
        release.id,
        SourceMapPathUtils.normalizeUploadPath(file.originalname),
        file.buffer,
      );
    }
    return { release: version, stored: files.length };
  }

  private async assertUploadToken(projectId: string, token: string | undefined): Promise<void> {
    const storedHash = await this.projectRepository.findUploadTokenHash(projectId);
    if (!token || !storedHash || !TokenUtils.safeEqual(TokenUtils.sha256(token), storedHash)) {
      throw new UnauthorizedException('Invalid upload token');
    }
  }
}
