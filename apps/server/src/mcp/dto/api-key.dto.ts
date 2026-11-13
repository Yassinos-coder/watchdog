import { ArrayMaxSize, ArrayUnique, IsArray, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { MCP_PERMISSION_IDS } from '../constants/mcp.constants';

export class CreateApiKeyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string;

  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(MCP_PERMISSION_IDS.length)
  @IsIn(MCP_PERMISSION_IDS, { each: true })
  permissions!: string[];
}

export class UpdateApiKeyDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(MCP_PERMISSION_IDS.length)
  @IsIn(MCP_PERMISSION_IDS, { each: true })
  permissions?: string[];
}
