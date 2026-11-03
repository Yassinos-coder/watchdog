import {
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { RateLimit } from 'nestjs-shield';
import { Public } from '../../auth/decorators/access.decorators';
import { ReleaseView, UploadedFile, UploadResult } from '../interfaces/source-map.interfaces';
import { SourceMapsService } from '../services/source-maps.service';

const MAX_FILES_PER_REQUEST = 50;
const MAX_FILE_BYTES = 50 * 1024 * 1024;

@Controller('projects/:projectId/releases')
export class SourceMapsController {
  constructor(private readonly sourceMapsService: SourceMapsService) {}

  @Get()
  list(@Param('projectId', ParseUUIDPipe) projectId: string): Promise<ReleaseView[]> {
    return this.sourceMapsService.listReleases(projectId);
  }

  @Public()
  @RateLimit({ limit: 120, ttl: 60_000 })
  @Post(':version/sourcemaps')
  @UseInterceptors(
    FilesInterceptor('files', MAX_FILES_PER_REQUEST, {
      limits: { fileSize: MAX_FILE_BYTES },
      preservePath: true,
    }),
  )
  upload(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('version') version: string,
    @Headers('authorization') authorization: string | undefined,
    @UploadedFiles() files: UploadedFile[] = [],
  ): Promise<UploadResult> {
    const token = authorization?.replace(/^Bearer\s+/i, '');
    return this.sourceMapsService.upload(projectId, decodeURIComponent(version), token, files);
  }
}
