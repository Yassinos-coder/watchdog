import { IsIn, IsOptional, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { AGGREGATIONS, MAX_TAG_KEY_LENGTH, SERIES_SOURCES, WIDGET_DISPLAYS } from '../constants/performance.constants';
import type { Aggregation, SeriesSource, WidgetDisplayKind } from '../interfaces/performance.interfaces';

export class CreateDashboardDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;
}

export class WidgetInput {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  title!: string;

  @IsIn(SERIES_SOURCES)
  source!: SeriesSource;

  @ValidateIf((input: WidgetInput) => input.source === 'METRIC')
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  metricName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  filterName?: string;

  @IsIn(AGGREGATIONS)
  aggregation!: Aggregation;

  @IsIn(WIDGET_DISPLAYS)
  display!: WidgetDisplayKind;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_TAG_KEY_LENGTH)
  groupBy?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_TAG_KEY_LENGTH)
  tagKey?: string;

  @ValidateIf((input: WidgetInput) => input.tagKey !== undefined)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  tagValue?: string;
}
