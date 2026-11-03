import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { PasswordValidator } from './password.validator';
import { RoleValidator } from './role.validator';

describe('PasswordValidator', () => {
  it('accepts a long, varied password', () => {
    expect(() => PasswordValidator.assertAcceptable('correct horse battery', 'a@b.co')).not.toThrow();
  });

  it('rejects short passwords', () => {
    expect(() => PasswordValidator.assertAcceptable('short', 'a@b.co')).toThrow(BadRequestException);
  });

  it('rejects overly long passwords', () => {
    expect(() => PasswordValidator.assertAcceptable('x'.repeat(200), 'a@b.co')).toThrow(
      BadRequestException,
    );
  });

  it('rejects passwords containing the email name', () => {
    expect(() =>
      PasswordValidator.assertAcceptable('my-yassine-secret-1', 'yassine@example.com'),
    ).toThrow(BadRequestException);
  });

  it('does not apply the email-name rule to very short names', () => {
    expect(() => PasswordValidator.assertAcceptable('correct horse battery', 'a@b.co')).not.toThrow();
  });

  it('rejects repetitive passwords', () => {
    expect(() => PasswordValidator.assertAcceptable('aaaaaaaaaaaaaaaaaaaa', 'a@b.co')).toThrow(
      BadRequestException,
    );
  });
});

describe('RoleValidator', () => {
  it('allows equal or higher roles', () => {
    expect(() => RoleValidator.assertAtLeast('OWNER', 'ADMIN')).not.toThrow();
    expect(() => RoleValidator.assertAtLeast('ADMIN', 'ADMIN')).not.toThrow();
  });

  it('blocks lower roles', () => {
    expect(() => RoleValidator.assertAtLeast('MEMBER', 'ADMIN')).toThrow(ForbiddenException);
    expect(() => RoleValidator.assertAtLeast('ADMIN', 'OWNER')).toThrow(ForbiddenException);
  });
});
