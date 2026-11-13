import { Injectable } from '@nestjs/common';
import { InstanceSettingRepository } from '../../mail/repositories/instance-setting.repository';
import { LIFECYCLE_SETTING_KEY } from '../constants/lifecycle.constants';
import { InstanceRecord } from '../interfaces/lifecycle.interfaces';
import { LifecycleUtils } from '../utils/lifecycle.utils';

@Injectable()
export class LifecycleRecordRepository {
  constructor(private readonly settings: InstanceSettingRepository) {}

  async find(): Promise<InstanceRecord | null> {
    return LifecycleUtils.parseRecord(await this.settings.get(LIFECYCLE_SETTING_KEY));
  }

  save(record: InstanceRecord): Promise<void> {
    return this.settings.set(LIFECYCLE_SETTING_KEY, JSON.stringify(record));
  }
}
