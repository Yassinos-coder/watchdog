import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { TeamValidator } from './team.validator';

describe('TeamValidator', () => {
  it('lets owners grant admin and member but admins only member', () => {
    expect(() => TeamValidator.assertCanGrant('OWNER', 'ADMIN')).not.toThrow();
    expect(() => TeamValidator.assertCanGrant('ADMIN', 'MEMBER')).not.toThrow();
    expect(() => TeamValidator.assertCanGrant('ADMIN', 'ADMIN')).toThrow(ForbiddenException);
    expect(() => TeamValidator.assertCanGrant('OWNER', 'OWNER')).toThrow(ForbiddenException);
  });

  it('only allows managing people ranked below you', () => {
    expect(() => TeamValidator.assertOutranks('OWNER', 'ADMIN')).not.toThrow();
    expect(() => TeamValidator.assertOutranks('ADMIN', 'ADMIN')).toThrow(ForbiddenException);
    expect(() => TeamValidator.assertOutranks('ADMIN', 'OWNER')).toThrow(ForbiddenException);
  });
});
