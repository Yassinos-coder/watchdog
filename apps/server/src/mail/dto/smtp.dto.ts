import { IsBoolean, IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class SaveSmtpDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  host!: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  port!: number;

  @IsBoolean()
  secure!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  user?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  password?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  from!: string;
}

export class SendTestEmailDto {
  @IsEmail()
  to!: string;
}
