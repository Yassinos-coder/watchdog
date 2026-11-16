import { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectRateLimiterService } from './project-rate-limiter.service';

const redisMock = vi.hoisted(() => {
  const clients: Array<{
    status: string;
    connect: ReturnType<typeof vi.fn>;
    eval: ReturnType<typeof vi.fn>;
    on: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
  }> = [];
  return { clients };
});

vi.mock('ioredis', () => ({
  default: class {
    status = 'wait';
    connect = vi.fn(async () => {
      this.status = 'ready';
    });
    eval = vi.fn(async () => 1);
    on = vi.fn();
    disconnect = vi.fn();

    constructor() {
      redisMock.clients.push(this);
    }
  },
}));

const createConfig = (redisUrl?: string): ConfigService =>
  new ConfigService({
    ingest: { eventsPerMinute: 1 },
    redis: { url: redisUrl },
  });

describe('ProjectRateLimiterService', () => {
  beforeEach(() => redisMock.clients.splice(0));

  it('limits requests independently per project', async () => {
    const limiter = new ProjectRateLimiterService(createConfig());

    await limiter.consume('project-a');
    await expect(limiter.consume('project-a')).rejects.toMatchObject({ status: 429 });
    await expect(limiter.consume('project-b')).resolves.toBeUndefined();
  });

  it('uses a shared Redis token bucket when configured', async () => {
    const limiter = new ProjectRateLimiterService(createConfig('redis://localhost'));
    const redis = redisMock.clients[0];

    await expect(limiter.consume('project-a')).resolves.toBeUndefined();

    expect(redis.eval).toHaveBeenCalledWith(
      expect.stringContaining("redis.call('HMGET'"),
      1,
      'app:watchdog:ingest:limit:project-a',
      1,
      expect.any(Number),
    );
    limiter.onModuleDestroy();
  });

  it('rejects a Redis-limited request without using the local fallback', async () => {
    const limiter = new ProjectRateLimiterService(createConfig('redis://localhost'));
    const redis = redisMock.clients[0];
    redis.eval.mockResolvedValue(0);

    await expect(limiter.consume('project-a')).rejects.toMatchObject({ status: 429 });
    expect(redis.eval).toHaveBeenCalledTimes(1);
    limiter.onModuleDestroy();
  });

  it('falls back to process-local limits when Redis is unavailable', async () => {
    const limiter = new ProjectRateLimiterService(createConfig('redis://localhost'));
    const redis = redisMock.clients[0];
    redis.eval.mockRejectedValueOnce(new Error('Redis unavailable'));

    await expect(limiter.consume('project-a')).resolves.toBeUndefined();
    await expect(limiter.consume('project-a')).rejects.toMatchObject({ status: 429 });
    expect(redis.eval).toHaveBeenCalledTimes(1);
    limiter.onModuleDestroy();
  });
});
