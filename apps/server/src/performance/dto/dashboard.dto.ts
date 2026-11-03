import { IsIn, IsOptional, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { AGGREGATIONS } from '../constants/performance.constants';
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

  @IsIn(['METRIC', 'TRANSACTIONS'])
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

  @IsIn(['LINE', 'BAR', 'NUMBER'])
  display!: WidgetDisplayKind;
}
