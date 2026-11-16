import { HttpException, HttpStatus, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

interface Bucket {
  tokens: number;
  updatedAt: number;
}

const MINUTE_MS = 60_000;
const IDLE_EVICTION_MS = 10 * MINUTE_MS;
const REDIS_RETRY_DELAY_MS = 30_000;
const REDIS_WARNING_INTERVAL_MS = 60_000;
const REDIS_COMMAND_TIMEOUT_MS = 500;
const TOKEN_BUCKET_SCRIPT = `
local capacity = tonumber(ARGV[1])
local now = tonumber(ARGV[2])
local bucket = redis.call('HMGET', KEYS[1], 'tokens', 'updatedAt')
local tokens = tonumber(bucket[1]) or capacity
local updatedAt = tonumber(bucket[2]) or now
tokens = math.min(capacity, tokens + math.max(0, now - updatedAt) * capacity / 60000)
if tokens < 1 then
  redis.call('HSET', KEYS[1], 'tokens', tokens, 'updatedAt', now)
  redis.call('PEXPIRE', KEYS[1], 600000)
  return 0
end
redis.call('HSET', KEYS[1], 'tokens', tokens - 1, 'updatedAt', now)
redis.call('PEXPIRE', KEYS[1], 600000)
return 1
`;

@Injectable()
export class ProjectRateLimiterService implements OnModuleDestroy {
  private readonly logger = new Logger(ProjectRateLimiterService.name);
  private readonly buckets = new Map<string, Bucket>();
  private readonly capacity: number;
  private readonly redis?: Redis;
  private redisConnectPromise?: Promise<void>;
  private redisUnavailableUntil = 0;
  private lastRedisWarningAt = 0;

  constructor(configService: ConfigService) {
    this.capacity = configService.getOrThrow<number>('ingest.eventsPerMinute');
    const redisUrl = configService.get<string>('redis.url');
    if (redisUrl) {
      this.redis = new Redis(redisUrl, {
        commandTimeout: REDIS_COMMAND_TIMEOUT_MS,
        connectTimeout: REDIS_COMMAND_TIMEOUT_MS,
        enableOfflineQueue: false,
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        retryStrategy: () => null,
      });
      this.redis.on('error', () => this.warnRedisUnavailable());
    }
  }

  async consume(projectId: string): Promise<void> {
    const now = Date.now();
    const redisResult = await this.consumeFromRedis(projectId, now);
    if (redisResult === 'consumed') {
      return;
    }
    if (redisResult === 'limited') {
      this.throwLimitExceeded();
    }
    this.consumeLocally(projectId, now);
  }

  onModuleDestroy(): void {
    this.redis?.disconnect();
  }

  private async consumeFromRedis(
    projectId: string,
    now: number,
  ): Promise<'consumed' | 'limited' | undefined> {
    if (!this.redis || now < this.redisUnavailableUntil) {
      return undefined;
    }
    try {
      await this.connectRedis();
      if (this.redis.status !== 'ready') {
        this.markRedisUnavailable(now);
        return undefined;
      }
      const allowed = await this.redis.eval(
        TOKEN_BUCKET_SCRIPT,
        1,
        `app:watchdog:ingest:limit:${projectId}`,
        this.capacity,
        now,
      );
      return Number(allowed) === 1 ? 'consumed' : 'limited';
    } catch {
      this.markRedisUnavailable(now);
      return undefined;
    }
  }

  private connectRedis(): Promise<void> {
    if (!this.redis || this.redis.status === 'ready') {
      return Promise.resolve();
    }
    if (!this.redisConnectPromise) {
      this.redisConnectPromise = this.redis.connect().finally(() => {
        this.redisConnectPromise = undefined;
      });
    }
    return this.redisConnectPromise;
  }

  private consumeLocally(projectId: string, now: number): void {
    const bucket = this.refill(projectId, now);
    if (bucket.tokens < 1) {
      this.throwLimitExceeded();
    }
    bucket.tokens -= 1;
    this.evictIdle(now);
  }

  private throwLimitExceeded(): never {
    throw new HttpException('Project event quota exceeded', HttpStatus.TOO_MANY_REQUESTS);
  }

  private refill(projectId: string, now: number): Bucket {
    const bucket = this.buckets.get(projectId) ?? { tokens: this.capacity, updatedAt: now };
    const refilled = (Math.max(0, now - bucket.updatedAt) / MINUTE_MS) * this.capacity;
    bucket.tokens = Math.min(this.capacity, bucket.tokens + refilled);
    bucket.updatedAt = Math.max(now, bucket.updatedAt);
    this.buckets.set(projectId, bucket);
    return bucket;
  }

  private markRedisUnavailable(now: number): void {
    this.redisUnavailableUntil = now + REDIS_RETRY_DELAY_MS;
    this.warnRedisUnavailable();
  }

  private warnRedisUnavailable(): void {
    const now = Date.now();
    if (now - this.lastRedisWarningAt < REDIS_WARNING_INTERVAL_MS) {
      return;
    }
    this.lastRedisWarningAt = now;
    this.logger.warn('Redis project quota unavailable; using process-local limits');
  }

  private evictIdle(now: number): void {
    if (this.buckets.size < 1_000) {
      return;
    }
    for (const [projectId, bucket] of this.buckets) {
      if (now - bucket.updatedAt > IDLE_EVICTION_MS) {
        this.buckets.delete(projectId);
      }
    }
  }
}
