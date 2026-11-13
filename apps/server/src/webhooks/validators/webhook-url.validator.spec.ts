import { describe, expect, it } from 'vitest';
import { WebhookUrlValidator } from './webhook-url.validator';

describe('WebhookUrlValidator.isPrivate', () => {
  it.each(['127.0.0.1', '10.1.2.3', '172.16.0.1', '172.31.255.255', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '::1', 'fd00::1', 'fe80::1', '::ffff:10.0.0.1'])(
    'blocks %s',
    (address) => {
      expect(WebhookUrlValidator.isPrivate(address)).toBe(true);
    },
  );

  it.each(['93.184.216.34', '8.8.8.8', '172.32.0.1', '1.1.1.1', '2606:4700:4700::1111'])('allows %s', (address) => {
    expect(WebhookUrlValidator.isPrivate(address)).toBe(false);
  });
});

describe('WebhookUrlValidator.parse', () => {
  it('requires https and no embedded credentials', () => {
    expect(() => WebhookUrlValidator.parse('http://example.com/hook')).toThrow('https://');
    expect(() => WebhookUrlValidator.parse('https://user:pass@example.com/hook')).toThrow('credentials');
    expect(() => WebhookUrlValidator.parse('nonsense')).toThrow('valid URL');
    expect(WebhookUrlValidator.parse('https://example.com/hook').hostname).toBe('example.com');
  });
});

describe('WebhookUrlValidator.assertPublic', () => {
  it('rejects localhost and private literals without any lookup', async () => {
    await expect(WebhookUrlValidator.assertPublic(new URL('https://127.0.0.1/hook'))).rejects.toThrow('public addresses');
    await expect(WebhookUrlValidator.assertPublic(new URL('https://[::1]/hook'))).rejects.toThrow('public addresses');
    await expect(WebhookUrlValidator.assertPublic(new URL('https://10.0.0.5/hook'))).rejects.toThrow('public addresses');
  });

  it('accepts a public address', async () => {
    await expect(WebhookUrlValidator.assertPublic(new URL('https://93.184.216.34/hook'))).resolves.toBeUndefined();
  });
});
