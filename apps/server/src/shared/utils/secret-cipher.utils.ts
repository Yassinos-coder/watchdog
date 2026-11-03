import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const VERSION = 'v1';
const IV_LENGTH = 12;

export class SecretCipher {
  static encrypt(plaintext: string, secretKey: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv('aes-256-gcm', SecretCipher.deriveKey(secretKey), iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    return [
      VERSION,
      iv.toString('base64'),
      cipher.getAuthTag().toString('base64'),
      ciphertext.toString('base64'),
    ].join(':');
  }

  static decrypt(payload: string, secretKey: string): string {
    const [version, iv, tag, ciphertext] = payload.split(':');
    if (version !== VERSION || !iv || !tag || !ciphertext) {
      throw new TypeError('Unsupported encrypted payload');
    }
    const decipher = createDecipheriv(
      'aes-256-gcm',
      SecretCipher.deriveKey(secretKey),
      Buffer.from(iv, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    return Buffer.concat([
      decipher.update(Buffer.from(ciphertext, 'base64')),
      decipher.final(),
    ]).toString('utf8');
  }

  private static deriveKey(secretKey: string): Buffer {
    return createHash('sha256').update(secretKey).digest();
  }
}
