import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { AGGREGATIONS, RANGE_KEYS } from '../constants/performance.constants';
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
  @IsIn(['METRIC', 'TRANSACTIONS'])
  source?: SeriesSource;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsIn(AGGREGATIONS)
  aggregation?: Aggregation;
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
