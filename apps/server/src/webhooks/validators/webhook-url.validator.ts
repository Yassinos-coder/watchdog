import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { BadRequestException } from '@nestjs/common';

const PRIVATE_V4: [number, number][] = [
  [0x00000000, 8],
  [0x0a000000, 8],
  [0x64400000, 10],
  [0x7f000000, 8],
  [0xa9fe0000, 16],
  [0xac100000, 12],
  [0xc0000000, 24],
  [0xc0a80000, 16],
  [0xc6120000, 15],
  [0xe0000000, 4],
  [0xf0000000, 4],
];

export class WebhookUrlValidator {
  static parse(value: string): URL {
    let url: URL;
    try {
      url = new URL(value.trim());
    } catch {
      throw new BadRequestException('The webhook URL is not a valid URL');
    }
    if (url.protocol !== 'https:') {
      throw new BadRequestException('The webhook URL must start with https://');
    }
    if (url.username || url.password) {
      throw new BadRequestException('Put credentials in the signing secret, not in the URL');
    }
    return url;
  }

  static async assertPublic(url: URL): Promise<void> {
    const host = url.hostname.replace(/^\[|\]$/g, '');
    const addresses = isIP(host) ? [host] : await WebhookUrlValidator.resolve(host);
    if (addresses.length === 0 || addresses.some(WebhookUrlValidator.isPrivate)) {
      throw new BadRequestException('Webhooks can only reach public addresses, not localhost or private networks');
    }
  }

  static isPrivate(address: string): boolean {
    const version = isIP(address);
    if (version === 4) {
      return WebhookUrlValidator.isPrivateV4(address);
    }
    if (version === 6) {
      return WebhookUrlValidator.isPrivateV6(address.toLowerCase());
    }
    return true;
  }

  private static async resolve(host: string): Promise<string[]> {
    try {
      return (await lookup(host, { all: true })).map((entry) => entry.address);
    } catch {
      throw new BadRequestException('Could not find that host. Check the webhook URL');
    }
  }

  private static isPrivateV4(address: string): boolean {
    const value = address.split('.').reduce((total, part) => total * 256 + Number(part), 0);
    return PRIVATE_V4.some(([base, bits]) => Math.floor(value / 2 ** (32 - bits)) === Math.floor(base / 2 ** (32 - bits)));
  }

  private static isPrivateV6(address: string): boolean {
    if (address === '::' || address === '::1') {
      return true;
    }
    const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(address);
    if (mapped) {
      return WebhookUrlValidator.isPrivateV4(mapped[1]);
    }
    return /^(fc|fd|fe[89ab])/.test(address);
  }
}
