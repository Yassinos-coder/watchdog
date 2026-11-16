import { InternalServerErrorException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { EnvironmentValidator } from './environment.validator';

const validConfig = {
  DATABASE_URL: 'postgresql://localhost/watchdog',
  WATCHDOG_SECRET_KEY: 'x'.repeat(32),
};

describe('EnvironmentValidator', () => {
  it('accepts a positive integer ingest quota', () => {
    expect(
      EnvironmentValidator.validate({ ...validConfig, INGEST_EVENTS_PER_MINUTE: '6000' }),
    ).toMatchObject({ INGEST_EVENTS_PER_MINUTE: '6000' });
  });

  it.each(['0', '-1', '1.5', 'not-a-number', '9007199254740992'])(
    'rejects invalid ingest quota %s',
    (ingestLimit) => {
      expect(() =>
        EnvironmentValidator.validate({ ...validConfig, INGEST_EVENTS_PER_MINUTE: ingestLimit }),
      ).toThrow(InternalServerErrorException);
    },
  );
});
