import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class IssueListQueryDto {
  @IsOptional()
  @IsIn(['UNRESOLVED', 'RESOLVED', 'IGNORED'])
  status?: 'UNRESOLVED' | 'RESOLVED' | 'IGNORED';

  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;

  @IsOptional()
  @IsIn(['lastSeen', 'firstSeen', 'events'])
  sort?: 'lastSeen' | 'firstSeen' | 'events';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}

export class PageQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}

export class StatsQueryDto {
  @IsOptional()
  @IsIn(['24h', '7d', '30d'])
  range?: '24h' | '7d' | '30d';
}

export class UpdateIssueDto {
  @IsIn(['UNRESOLVED', 'RESOLVED', 'IGNORED'])
  status!: 'UNRESOLVED' | 'RESOLVED' | 'IGNORED';
}
