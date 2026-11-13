import { Injectable, Logger } from '@nestjs/common';
import { AlertMessage } from '../../alerts/interfaces/alert.interfaces';
import { AlertChannelRepository } from '../../alerts/repositories/alert-channel.repository';
import { AlertChannelsService } from '../../alerts/services/alert-channels.service';
import type { AlertChannel } from '../../generated/prisma/client';
import { SEND_TIMEOUT_MS } from '../constants/lifecycle.constants';
import { LifecycleUtils } from '../utils/lifecycle.utils';

@Injectable()
export class LifecycleNotifier {
  private readonly logger = new Logger(LifecycleNotifier.name);

  constructor(
    private readonly channelRepository: AlertChannelRepository,
    private readonly channelsService: AlertChannelsService,
  ) {}

  async broadcast(message: AlertMessage): Promise<void> {
    const channels = (await this.channelRepository.findAll()).filter((channel) => channel.enabled);
    await Promise.all(channels.map((channel) => this.sendOne(channel, message)));
  }

  private async sendOne(channel: AlertChannel, message: AlertMessage): Promise<void> {
    try {
      await LifecycleUtils.withTimeout(
        this.channelsService.send(channel, message),
        SEND_TIMEOUT_MS,
      );
    } catch (error) {
      this.logger.warn(
        `Could not send "${message.reason}" to "${channel.name}": ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
