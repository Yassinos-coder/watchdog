import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RoleValidator } from '../../auth/validators/role.validator';
import type { AlertChannel, User } from '../../generated/prisma/client';
import { SecretCipher } from '../../shared/utils/secret-cipher.utils';
import { MAX_CHANNELS } from '../constants/alert.constants';
import { CreateChannelDto, UpdateChannelDto } from '../dto/alert.dto';
import { AlertMessage, ChannelConfig, ChannelSender, ChannelView } from '../interfaces/alert.interfaces';
import { AlertMessageMapper } from '../mappers/alert-message.mapper';
import { AlertChannelRepository } from '../repositories/alert-channel.repository';
import { ChannelConfigValidator } from '../validators/channel-config.validator';
import { CHANNEL_SENDERS } from '../alerts.tokens';
import { TelegramChatResolver } from './telegram-chat-resolver.service';

@Injectable()
export class AlertChannelsService {
  constructor(
    private readonly channelRepository: AlertChannelRepository,
    private readonly configService: ConfigService,
    private readonly telegramResolver: TelegramChatResolver,
    @Inject(CHANNEL_SENDERS) private readonly senders: ChannelSender[],
  ) {}

  async list(): Promise<ChannelView[]> {
    return (await this.channelRepository.findAll()).map((channel) => this.toView(channel));
  }

  async create(user: User, dto: CreateChannelDto): Promise<ChannelView> {
    RoleValidator.assertAtLeast(user.role, 'ADMIN');
    if ((await this.channelRepository.count()) >= MAX_CHANNELS) {
      throw new BadRequestException(`You can have at most ${MAX_CHANNELS} channels`);
    }
    const config = await this.resolveTelegramChat(ChannelConfigValidator.parse(dto.type, dto.config));
    const channel = await this.channelRepository.create({
      type: dto.type,
      name: dto.name.trim(),
      configEnc: this.encrypt(config),
      hint: ChannelConfigValidator.hint(dto.type, config),
    });
    return this.toView(channel);
  }

  async update(user: User, id: string, dto: UpdateChannelDto): Promise<ChannelView> {
    RoleValidator.assertAtLeast(user.role, 'ADMIN');
    const existing = await this.require(id);
    const config = dto.config
      ? await this.resolveTelegramChat(ChannelConfigValidator.parse(existing.type, dto.config))
      : null;
    const channel = await this.channelRepository.update(id, {
      name: dto.name?.trim(),
      enabled: dto.enabled,
      ...(config ? { configEnc: this.encrypt(config), hint: ChannelConfigValidator.hint(existing.type, config) } : {}),
    });
    return this.toView(channel);
  }

  async remove(user: User, id: string): Promise<void> {
    RoleValidator.assertAtLeast(user.role, 'ADMIN');
    await this.require(id);
    await this.channelRepository.delete(id);
  }

  async sendTest(user: User, id: string): Promise<void> {
    RoleValidator.assertAtLeast(user.role, 'ADMIN');
    const channel = await this.require(id);
    try {
      await this.send(channel, AlertMessageMapper.sample(this.configService.getOrThrow<string>('appUrl')));
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'The test alert could not be sent');
    }
  }

  async send(channel: AlertChannel, message: AlertMessage): Promise<void> {
    const sender = this.senders.find((candidate) => candidate.type === channel.type);
    if (!sender) {
      throw new TypeError(`Unsupported channel type ${channel.type}`);
    }
    await sender.send(this.decrypt(channel.configEnc), message);
  }

  private async resolveTelegramChat(config: ChannelConfig): Promise<ChannelConfig> {
    if (!('botToken' in config)) {
      return config;
    }
    return { ...config, chatId: await this.telegramResolver.resolve(config.botToken, config.chatId) };
  }

  private async require(id: string): Promise<AlertChannel> {
    const channel = await this.channelRepository.findById(id);
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }
    return channel;
  }

  private toView(channel: AlertChannel): ChannelView {
    return {
      id: channel.id,
      type: channel.type,
      name: channel.name,
      hint: channel.hint,
      enabled: channel.enabled,
      createdAt: channel.createdAt,
    };
  }

  private encrypt(config: ChannelConfig): string {
    return SecretCipher.encrypt(JSON.stringify(config), this.secretKey());
  }

  private decrypt(payload: string): ChannelConfig {
    return JSON.parse(SecretCipher.decrypt(payload, this.secretKey())) as ChannelConfig;
  }

  private secretKey(): string {
    return this.configService.getOrThrow<string>('security.secretKey');
  }
}
