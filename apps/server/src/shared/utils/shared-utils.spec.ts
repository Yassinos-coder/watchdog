import { describe, expect, it } from 'vitest';
import { PasswordUtils } from './password.utils';
import { SecretCipher } from './secret-cipher.utils';
import { TokenUtils } from './token.utils';

describe('PasswordUtils', () => {
  it('verifies the correct password and rejects a wrong one', async () => {
    const hash = await PasswordUtils.hash('correct horse battery staple');

    expect(await PasswordUtils.verify('correct horse battery staple', hash)).toBe(true);
    expect(await PasswordUtils.verify('wrong password', hash)).toBe(false);
  });

  it('salts every hash differently', async () => {
    const [first, second] = await Promise.all([
      PasswordUtils.hash('same password here'),
      PasswordUtils.hash('same password here'),
    ]);

    expect(first).not.toBe(second);
  });

  it('rejects malformed stored hashes', async () => {
    expect(await PasswordUtils.verify('anything', 'not-a-hash')).toBe(false);
    expect(await PasswordUtils.verify('anything', 'bcrypt$1$2$3$4$5')).toBe(false);
  });
});

describe('SecretCipher', () => {
  const key = 'a-sufficiently-long-secret-key-for-tests';

  it('round-trips plaintext', () => {
    const encrypted = SecretCipher.encrypt('JBSWY3DPEHPK3PXP', key);

    expect(encrypted).not.toContain('JBSWY3DPEHPK3PXP');
    expect(SecretCipher.decrypt(encrypted, key)).toBe('JBSWY3DPEHPK3PXP');
  });

  it('uses a fresh IV each time', () => {
    expect(SecretCipher.encrypt('value', key)).not.toBe(SecretCipher.encrypt('value', key));
  });

  it('fails with the wrong key', () => {
    const encrypted = SecretCipher.encrypt('value', key);

    expect(() => SecretCipher.decrypt(encrypted, 'another-secret-key-that-is-also-long')).toThrow();
  });

  it('fails when the payload is tampered with', () => {
    const [version, iv, tag, ciphertext] = SecretCipher.encrypt('value', key).split(':');
    const flipped = Buffer.from(ciphertext, 'base64');
    flipped[0] ^= 0xff;

    expect(() =>
      SecretCipher.decrypt([version, iv, tag, flipped.toString('base64')].join(':'), key),
    ).toThrow();
  });

  it('rejects unsupported payload formats', () => {
    expect(() => SecretCipher.decrypt('v9:a:b:c', key)).toThrow(TypeError);
  });
});

describe('TokenUtils', () => {
  it('generates unique url-safe tokens', () => {
    const tokens = new Set(Array.from({ length: 50 }, () => TokenUtils.generate()));

    expect(tokens.size).toBe(50);
    expect([...tokens][0]).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('hashes deterministically', () => {
    expect(TokenUtils.sha256('abc')).toBe(TokenUtils.sha256('abc'));
    expect(TokenUtils.sha256('abc')).toHaveLength(64);
  });

  it('compares safely, including different lengths', () => {
    expect(TokenUtils.safeEqual('same', 'same')).toBe(true);
    expect(TokenUtils.safeEqual('same', 'diff')).toBe(false);
    expect(TokenUtils.safeEqual('short', 'much longer value')).toBe(false);
  });
});
