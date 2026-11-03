import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

const normalizeEmail = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class SetupDto {
  @IsString()
  @IsNotEmpty()
  setupToken!: string;

  @Transform(normalizeEmail)
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsString()
  password!: string;
}

export class LoginDto {
  @Transform(normalizeEmail)
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class VerifyMfaDto {
  @IsIn(['totp', 'recovery', 'email'])
  method!: 'totp' | 'recovery' | 'email';

  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  code!: string;
}

export class ConfirmCodeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  code!: string;
}

export class PasskeyResponseDto {
  @IsObject()
  response!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  name?: string;
}
