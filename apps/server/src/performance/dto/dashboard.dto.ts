import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  AGGREGATIONS,
  DASHBOARD_COLUMNS,
  MAX_TAG_KEY_LENGTH,
  MAX_WIDGET_HEIGHT,
  MAX_WIDGET_ROW,
  MAX_WIDGETS_PER_DASHBOARD,
  MIN_WIDGET_HEIGHT,
  MIN_WIDGET_WIDTH,
  SERIES_SOURCES,
  WIDGET_DISPLAYS,
} from '../constants/performance.constants';
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

export class WidgetLayoutItem {
  @IsUUID()
  id!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(DASHBOARD_COLUMNS - MIN_WIDGET_WIDTH)
  x!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_WIDGET_ROW)
  y!: number;

  @Type(() => Number)
  @IsInt()
  @Min(MIN_WIDGET_WIDTH)
  @Max(DASHBOARD_COLUMNS)
  w!: number;

  @Type(() => Number)
  @IsInt()
  @Min(MIN_WIDGET_HEIGHT)
  @Max(MAX_WIDGET_HEIGHT)
  h!: number;
}

export class UpdateLayoutDto {
  @IsArray()
  @ArrayMaxSize(MAX_WIDGETS_PER_DASHBOARD)
  @ValidateNested({ each: true })
  @Type(() => WidgetLayoutItem)
  items!: WidgetLayoutItem[];
}
