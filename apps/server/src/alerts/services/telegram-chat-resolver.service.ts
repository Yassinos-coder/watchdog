import { BadRequestException, Injectable } from '@nestjs/common';
import { TELEGRAM_UPDATES_LIMIT } from '../constants/alert.constants';
import { TelegramBotInfo, TelegramUpdate } from '../interfaces/alert.interfaces';
import { TelegramApi } from './telegram-api.service';

@Injectable()
export class TelegramChatResolver {
  constructor(private readonly api: TelegramApi) {}

  async resolve(botToken: string, chatId: string): Promise<string> {
    if (!chatId.startsWith('@')) {
      return chatId;
    }
    const bot = await this.api.call<TelegramBotInfo>(botToken, 'getMe');
    if (!bot.ok) {
      throw new BadRequestException('Telegram did not accept this bot token. Copy it again from @BotFather');
    }
    const personal = await this.findPrivateChat(botToken, chatId);
    if (personal) {
      return personal;
    }
    if ((await this.api.call(botToken, 'getChat', { chat_id: chatId })).ok) {
      return chatId;
    }
    throw new BadRequestException(
      `Telegram cannot message ${chatId} yet. Open @${bot.result.username} in Telegram, press Start (or send it any message), then add the channel again`,
    );
  }

  private async findPrivateChat(botToken: string, handle: string): Promise<string | null> {
    const updates = await this.api.call<TelegramUpdate[]>(botToken, 'getUpdates', {
      limit: String(TELEGRAM_UPDATES_LIMIT),
      allowed_updates: JSON.stringify(['message']),
    });
    if (!updates.ok) {
      return null;
    }
    const wanted = handle.slice(1).toLowerCase();
    const match = [...updates.result]
      .reverse()
      .map((update) => update.message?.chat)
      .find((chat) => chat?.type === 'private' && chat.username?.toLowerCase() === wanted);
    return match ? String(match.id) : null;
  }
}
