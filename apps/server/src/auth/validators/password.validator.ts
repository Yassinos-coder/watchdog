import { BadRequestException } from '@nestjs/common';
import {
  MAX_PASSWORD_LENGTH,
  MIN_EMAIL_NAME_LENGTH_CHECKED,
  MIN_PASSWORD_LENGTH,
} from '../constants/auth.constants';

export class PasswordValidator {
  static assertAcceptable(password: string, email: string): void {
    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new BadRequestException(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    }
    if (password.length > MAX_PASSWORD_LENGTH) {
      throw new BadRequestException(`Password must be at most ${MAX_PASSWORD_LENGTH} characters`);
    }
    const emailName = email.split('@')[0].toLowerCase();
    if (emailName.length >= MIN_EMAIL_NAME_LENGTH_CHECKED && password.toLowerCase().includes(emailName)) {
      throw new BadRequestException('Password must not contain your email name');
    }
    if (new Set(password).size < 5) {
      throw new BadRequestException('Password is too repetitive');
    }
  }
}
