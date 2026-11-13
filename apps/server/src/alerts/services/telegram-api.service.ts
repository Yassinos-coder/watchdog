import { Injectable } from '@nestjs/common';
import { TELEGRAM_API_HOST, WEBHOOK_TIMEOUT_MS } from '../constants/alert.constants';
import { TelegramApiResult } from '../interfaces/alert.interfaces';

@Injectable()
export class TelegramApi {
  async call<T>(botToken: string, method: string, params: Record<string, string> = {}): Promise<TelegramApiResult<T>> {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`https://${TELEGRAM_API_HOST}/bot${botToken}/${method}${query ? `?${query}` : ''}`, {
      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
      redirect: 'error',
    });
    const body = (await response.json().catch(() => null)) as { ok?: boolean; result?: T; description?: string } | null;
    if (response.ok && body?.ok) {
      return { ok: true, result: body.result as T };
    }
    return { ok: false, status: response.status, description: body?.description ?? 'No answer from Telegram' };
  }
}
