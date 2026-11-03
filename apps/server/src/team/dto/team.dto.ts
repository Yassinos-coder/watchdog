import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { INVITABLE_ROLES } from '../constants/team.constants';

const normalizeEmail = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class CreateInviteDto {
  @Transform(normalizeEmail)
  @IsEmail()
  email!: string;

  @IsIn(INVITABLE_ROLES)
  role!: 'ADMIN' | 'MEMBER';
}

export class AcceptInviteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  token!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsString()
  password!: string;
}

export class UpdateMemberRoleDto {
  @IsIn(INVITABLE_ROLES)
  role!: 'ADMIN' | 'MEMBER';
}
