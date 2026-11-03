import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class InstanceSettingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async get(key: string): Promise<string | null> {
    const setting = await this.prisma.instanceSetting.findUnique({ where: { key } });
    return setting?.valueEnc ?? null;
  }

  async set(key: string, valueEnc: string): Promise<void> {
    await this.prisma.instanceSetting.upsert({
      where: { key },
      create: { key, valueEnc },
      update: { valueEnc },
    });
  }

  async remove(key: string): Promise<void> {
    await this.prisma.instanceSetting.deleteMany({ where: { key } });
  }
}
