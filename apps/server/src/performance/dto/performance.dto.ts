import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, ValidateIf } from 'class-validator';
import { AGGREGATIONS, MAX_TAG_KEY_LENGTH, RANGE_KEYS, SERIES_SOURCES } from '../constants/performance.constants';
import type { Aggregation, RangeKey, SeriesSource } from '../interfaces/performance.interfaces';

export class RangeQueryDto {
  @IsOptional()
  @IsIn(RANGE_KEYS)
  range?: RangeKey;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  environment?: string;
}

export class SeriesQueryDto extends RangeQueryDto {
  @IsOptional()
  @IsIn(SERIES_SOURCES)
  source?: SeriesSource;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsIn(AGGREGATIONS)
  aggregation?: Aggregation;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_TAG_KEY_LENGTH)
  groupBy?: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_TAG_KEY_LENGTH)
  tagKey?: string;

  @ValidateIf((query: SeriesQueryDto) => query.tagKey !== undefined)
  @IsString()
  @MaxLength(200)
  tagValue?: string;
}

export class TagKeysQueryDto {
  @IsOptional()
  @IsIn(SERIES_SOURCES)
  source?: SeriesSource;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;
}

export class TransactionListQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

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
