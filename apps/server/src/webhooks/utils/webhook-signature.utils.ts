import { createHmac, timingSafeEqual } from 'node:crypto';

export class WebhookSignatureUtils {
  static sign(secret: string, timestamp: number, body: string): string {
    const digest = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
    return `t=${timestamp},v1=${digest}`;
  }

  static verify(secret: string, header: string, body: string, toleranceSeconds = 300, now = Date.now()): boolean {
    const parts = Object.fromEntries(header.split(',').map((part) => part.split('=') as [string, string]));
    const timestamp = Number(parts.t);
    if (!Number.isFinite(timestamp) || Math.abs(now / 1000 - timestamp) > toleranceSeconds || !parts.v1) {
      return false;
    }
    const expected = Buffer.from(WebhookSignatureUtils.sign(secret, timestamp, body).split('v1=')[1], 'hex');
    const received = Buffer.from(parts.v1, 'hex');
    return expected.length === received.length && timingSafeEqual(expected, received);
  }
}
