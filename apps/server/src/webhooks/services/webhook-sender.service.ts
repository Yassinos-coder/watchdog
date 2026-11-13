import { Injectable } from '@nestjs/common';
import { WEBHOOK_TIMEOUT_MS } from '../constants/webhook.constants';

@Injectable()
export class WebhookSender {
  async post(url: string, headers: Record<string, string>, body: string): Promise<number> {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'user-agent': 'Watchdog-Webhooks', ...headers },
      body,
      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
      redirect: 'error',
    });
    await response.arrayBuffer().catch(() => undefined);
    return response.status;
  }
}
