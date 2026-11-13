import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { WEBHOOK_EVENT_IDS } from '../constants/webhook.constants';

export class CreateWebhookDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  url!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(WEBHOOK_EVENT_IDS.length)
  @ArrayUnique()
  @IsIn(WEBHOOK_EVENT_IDS, { each: true })
  events!: string[];
}

export class UpdateWebhookDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  url?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(WEBHOOK_EVENT_IDS.length)
  @ArrayUnique()
  @IsIn(WEBHOOK_EVENT_IDS, { each: true })
  events?: string[];

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
