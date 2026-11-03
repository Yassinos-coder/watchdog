import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export class TokenUtils {
  static generate(byteLength = 32): string {
    return randomBytes(byteLength).toString('base64url');
  }

  static sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  static safeEqual(a: string, b: string): boolean {
    const left = Buffer.from(a);
    const right = Buffer.from(b);
    if (left.length !== right.length) {
      return false;
    }
    return timingSafeEqual(left, right);
  }
}
