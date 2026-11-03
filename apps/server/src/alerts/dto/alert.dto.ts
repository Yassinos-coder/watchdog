import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

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

  @IsIn(['NEW_ISSUE', 'REGRESSION', 'SPIKE'])
  trigger!: 'NEW_ISSUE' | 'REGRESSION' | 'SPIKE';

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
  @IsIn(['NEW_ISSUE', 'REGRESSION', 'SPIKE'])
  trigger?: 'NEW_ISSUE' | 'REGRESSION' | 'SPIKE';

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
