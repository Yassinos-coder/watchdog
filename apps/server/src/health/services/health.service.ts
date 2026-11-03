import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { HealthStatus, ReadinessStatus } from '../interfaces/health-status.interface';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  getLiveness(): HealthStatus {
    return {
      status: 'ok',
      service: 'watchdog-server',
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }

  async getReadiness(): Promise<ReadinessStatus> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException('Database is not reachable');
    }
    return { status: 'ok', database: 'up' };
  }
}
