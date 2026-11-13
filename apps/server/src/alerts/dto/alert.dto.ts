import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import type { AlertTrigger, MetricComparator, WidgetAggregation, WidgetSource } from '../../generated/prisma/enums';
import { ALERT_TRIGGERS, METRIC_AGGREGATIONS } from '../constants/alert.constants';

export class CreateChannelDto {
  @IsIn(['SLACK', 'DISCORD', 'TELEGRAM', 'EMAIL'])
  type!: 'SLACK' | 'DISCORD' | 'TELEGRAM' | 'EMAIL';

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string;

  @IsObject()
  config!: Record<string, unknown>;
}

export class UpdateChannelDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}

export class CreateRuleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string;

  @IsIn(ALERT_TRIGGERS)
  trigger!: AlertTrigger;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2)
  @Max(100_000)
  spikeThreshold?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1440)
  spikeWindowMins?: number;

  @IsOptional()
  @IsIn(['METRIC', 'TRANSACTIONS'])
  metricSource?: WidgetSource;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  metricName?: string;

  @IsOptional()
  @IsIn(METRIC_AGGREGATIONS)
  metricAggregation?: WidgetAggregation;

  @IsOptional()
  @IsIn(['ABOVE', 'BELOW'])
  metricComparator?: MetricComparator;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  metricThreshold?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1440)
  metricWindowMins?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  metricTagKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  metricTagValue?: string;

  @IsOptional()
  @IsIn(['debug', 'info', 'warning', 'error', 'fatal'])
  minLevel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  environment?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1440)
  cooldownMins?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsUUID(undefined, { each: true })
  channelIds!: string[];
}

export class UpdateRuleDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsIn(ALERT_TRIGGERS)
  trigger?: AlertTrigger;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2)
  @Max(100_000)
  spikeThreshold?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1440)
  spikeWindowMins?: number;

  @IsOptional()
  @IsIn(['METRIC', 'TRANSACTIONS'])
  metricSource?: WidgetSource;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  metricName?: string;

  @IsOptional()
  @IsIn(METRIC_AGGREGATIONS)
  metricAggregation?: WidgetAggregation;

  @IsOptional()
  @IsIn(['ABOVE', 'BELOW'])
  metricComparator?: MetricComparator;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  metricThreshold?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1440)
  metricWindowMins?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  metricTagKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  metricTagValue?: string;

  @IsOptional()
  @IsIn(['debug', 'info', 'warning', 'error', 'fatal'])
  minLevel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  environment?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1440)
  cooldownMins?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsUUID(undefined, { each: true })
  channelIds?: string[];
}
