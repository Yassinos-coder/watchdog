import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface Bucket {
  tokens: number;
  updatedAt: number;
}

const MINUTE_MS = 60_000;
const IDLE_EVICTION_MS = 10 * MINUTE_MS;

@Injectable()
export class ProjectRateLimiterService {
  private readonly buckets = new Map<string, Bucket>();
  private readonly capacity: number;

  constructor(configService: ConfigService) {
    this.capacity = configService.getOrThrow<number>('ingest.eventsPerMinute');
  }

  consume(projectId: string): void {
    const now = Date.now();
    const bucket = this.refill(projectId, now);
    if (bucket.tokens < 1) {
      throw new HttpException('Project event quota exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }
    bucket.tokens -= 1;
    this.evictIdle(now);
  }

  private refill(projectId: string, now: number): Bucket {
    const bucket = this.buckets.get(projectId) ?? { tokens: this.capacity, updatedAt: now };
    const refilled = ((now - bucket.updatedAt) / MINUTE_MS) * this.capacity;
    bucket.tokens = Math.min(this.capacity, bucket.tokens + refilled);
    bucket.updatedAt = now;
    this.buckets.set(projectId, bucket);
    return bucket;
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
