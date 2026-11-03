import { argon2, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const argon2Async = promisify(argon2);

const ALGORITHM = 'argon2id';
const MEMORY_KIB = 19456;
const PASSES = 2;
const PARALLELISM = 1;
const TAG_LENGTH = 32;
const SALT_LENGTH = 16;

export class PasswordUtils {
  static async hash(password: string): Promise<string> {
    const salt = randomBytes(SALT_LENGTH);
    const derived = await PasswordUtils.derive(password, salt, MEMORY_KIB, PASSES, PARALLELISM);
    return [
      ALGORITHM,
      MEMORY_KIB,
      PASSES,
      PARALLELISM,
      salt.toString('base64'),
      derived.toString('base64'),
    ].join('$');
  }

  static async verify(password: string, stored: string): Promise<boolean> {
    const [algorithm, memory, passes, parallelism, saltB64, hashB64] = stored.split('$');
    if (algorithm !== ALGORITHM || !saltB64 || !hashB64) {
      return false;
    }
    const expected = Buffer.from(hashB64, 'base64');
    const derived = await PasswordUtils.derive(
      password,
      Buffer.from(saltB64, 'base64'),
      Number(memory),
      Number(passes),
      Number(parallelism),
    );
    return derived.length === expected.length && timingSafeEqual(derived, expected);
  }

  static async burn(password: string): Promise<void> {
    await PasswordUtils.derive(password, randomBytes(SALT_LENGTH), MEMORY_KIB, PASSES, PARALLELISM);
  }

  private static async derive(
    password: string,
    salt: Buffer,
    memory: number,
    passes: number,
    parallelism: number,
  ): Promise<Buffer> {
    const result = await argon2Async(ALGORITHM, {
      message: Buffer.from(password),
      nonce: salt,
      memory,
      passes,
      parallelism,
      tagLength: TAG_LENGTH,
    });
    return Buffer.from(result);
  }
}
