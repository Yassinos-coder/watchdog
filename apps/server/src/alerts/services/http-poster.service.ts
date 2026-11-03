import { Injectable } from '@nestjs/common';
import { MAX_ERROR_LENGTH, WEBHOOK_TIMEOUT_MS } from '../constants/alert.constants';

@Injectable()
export class HttpPoster {
  async postJson(url: string, body: unknown): Promise<void> {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
      redirect: 'error',
    });
    if (response.ok) {
      return;
    }
    const detail = await response.text().catch(() => '');
    throw new TypeError(
      `Provider answered ${response.status}${detail ? `: ${detail.slice(0, MAX_ERROR_LENGTH)}` : ''}`,
    );
  }
}
