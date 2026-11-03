import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  platform?: string;
}

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  platform?: string;
}

export class CreateKeyDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  label?: string;
}

export class UpdateKeyDto {
  @IsBoolean()
  active!: boolean;
}
