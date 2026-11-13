import { describe, expect, it } from 'vitest';
import { WebhookSignatureUtils } from './webhook-signature.utils';

const SECRET = 'whsec_test';
const BODY = '{"type":"issue.new"}';
const NOW = 1_800_000_000_000;

describe('WebhookSignatureUtils', () => {
  it('signs the timestamp and body so a receiver can verify them', () => {
    const header = WebhookSignatureUtils.sign(SECRET, NOW / 1000, BODY);

    expect(header).toMatch(/^t=1800000000,v1=[0-9a-f]{64}$/);
    expect(WebhookSignatureUtils.verify(SECRET, header, BODY, 300, NOW)).toBe(true);
  });

  it('rejects a changed body, the wrong secret and stale timestamps', () => {
    const header = WebhookSignatureUtils.sign(SECRET, NOW / 1000, BODY);

    expect(WebhookSignatureUtils.verify(SECRET, header, `${BODY} `, 300, NOW)).toBe(false);
    expect(WebhookSignatureUtils.verify('whsec_other', header, BODY, 300, NOW)).toBe(false);
    expect(WebhookSignatureUtils.verify(SECRET, header, BODY, 300, NOW + 10 * 60_000)).toBe(false);
    expect(WebhookSignatureUtils.verify(SECRET, 'garbage', BODY, 300, NOW)).toBe(false);
  });
});
