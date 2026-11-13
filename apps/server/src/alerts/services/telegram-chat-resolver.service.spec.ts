import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { TelegramApiResult } from '../interfaces/alert.interfaces';
import { TelegramApi } from './telegram-api.service';
import { TelegramChatResolver } from './telegram-chat-resolver.service';

type Answers = Record<string, TelegramApiResult<unknown>>;

const fakeApi = (answers: Answers) => {
  const calls: string[] = [];
  const api = {
    call: async (_token: string, method: string) => {
      calls.push(method);
      return answers[method] ?? { ok: false, status: 404, description: 'not found' };
    },
  } as unknown as TelegramApi;
  return { resolver: new TelegramChatResolver(api), calls };
};

const bot: TelegramApiResult<unknown> = { ok: true, result: { username: 'WatchDogBot' } };
const updates = (...chats: { id: number; type: string; username?: string }[]): TelegramApiResult<unknown> => ({
  ok: true,
  result: chats.map((chat) => ({ message: { chat } })),
});

describe('TelegramChatResolver', () => {
  it('leaves numeric chat ids alone without calling Telegram', async () => {
    const { resolver, calls } = fakeApi({});

    expect(await resolver.resolve('token', '-100123456')).toBe('-100123456');
    expect(calls).toHaveLength(0);
  });

  it('turns a username into the private chat id of the person who pressed Start', async () => {
    const { resolver } = fakeApi({
      getMe: bot,
      getUpdates: updates({ id: 77, type: 'private', username: 'someone_else' }, { id: 4242, type: 'private', username: 'Yassinos08' }),
    });

    expect(await resolver.resolve('token', '@yassinos08')).toBe('4242');
  });

  it('ignores groups that share the name and prefers the newest private chat', async () => {
    const { resolver } = fakeApi({
      getMe: bot,
      getUpdates: updates(
        { id: 1, type: 'private', username: 'me_user' },
        { id: -5, type: 'group', username: 'me_user' },
        { id: 2, type: 'private', username: 'me_user' },
      ),
    });

    expect(await resolver.resolve('token', '@me_user')).toBe('2');
  });

  it('keeps the name for a public channel', async () => {
    const { resolver, calls } = fakeApi({ getMe: bot, getUpdates: updates(), getChat: { ok: true, result: {} } });

    expect(await resolver.resolve('token', '@my_alerts')).toBe('@my_alerts');
    expect(calls).toContain('getChat');
  });

  it('tells the person to press Start in the bot when the chat cannot be found', async () => {
    const { resolver } = fakeApi({ getMe: bot, getUpdates: updates() });

    await expect(resolver.resolve('token', '@nobody')).rejects.toThrow('Open @WatchDogBot in Telegram, press Start');
  });

  it('rejects a bot token Telegram does not accept', async () => {
    const { resolver } = fakeApi({ getMe: { ok: false, status: 401, description: 'Unauthorized' } });

    await expect(resolver.resolve('bad', '@nobody')).rejects.toBeInstanceOf(BadRequestException);
  });
});
