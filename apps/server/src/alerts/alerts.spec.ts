import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AlertMessage } from './interfaces/alert.interfaces';
import { DiscordSender } from './senders/discord.sender';
import { EmailSender } from './senders/email.sender';
import { SlackSender } from './senders/slack.sender';
import { TelegramSender } from './senders/telegram.sender';
import { HttpPoster } from './services/http-poster.service';
import { SpikeDetector } from './utils/spike-detector';
import { ChannelConfigValidator } from './validators/channel-config.validator';

const SLACK_URL = 'https://hooks.slack.com/services/T0000/B0000/abcdefghijklmnopqrstuvwx';
const DISCORD_URL = 'https://discord.com/api/webhooks/123456789/abcdefghijklmnop';
const TELEGRAM_TOKEN = '123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw';

const message: AlertMessage = {
  trigger: 'NEW_ISSUE',
  reason: 'New issue',
  title: 'TypeError: <b>x</b> & y',
  culprit: 'checkout (src/a.ts:4)',
  projectName: 'Storefront',
  level: 'error',
  environment: 'production',
  release: '1.0.0',
  eventCount: 3,
  issueUrl: 'https://wd.example.com/projects/p/issues/i',
};

describe('ChannelConfigValidator', () => {
  it('accepts real Slack and Discord webhook urls', () => {
    expect(ChannelConfigValidator.parse('SLACK', { webhookUrl: SLACK_URL })).toEqual({ webhookUrl: SLACK_URL });
    expect(ChannelConfigValidator.parse('DISCORD', { webhookUrl: DISCORD_URL })).toEqual({ webhookUrl: DISCORD_URL });
  });

  it('blocks webhook urls that could reach internal services', () => {
    const bad = [
      'http://hooks.slack.com/services/x',
      'https://localhost/hook',
      'https://169.254.169.254/latest/meta-data',
      'https://hooks.slack.com.evil.example/services/x',
      'https://user:pass@hooks.slack.com/services/x',
      'not a url',
    ];

    for (const webhookUrl of bad) {
      expect(() => ChannelConfigValidator.parse('SLACK', { webhookUrl })).toThrow(BadRequestException);
    }
    expect(() => ChannelConfigValidator.parse('DISCORD', { webhookUrl: SLACK_URL })).toThrow(BadRequestException);
    expect(() => ChannelConfigValidator.parse('SLACK', {})).toThrow(BadRequestException);
  });

  it('validates Telegram credentials', () => {
    expect(ChannelConfigValidator.parse('TELEGRAM', { botToken: TELEGRAM_TOKEN, chatId: '-1001234567890' })).toEqual({
      botToken: TELEGRAM_TOKEN,
      chatId: '-1001234567890',
    });
    expect(ChannelConfigValidator.parse('TELEGRAM', { botToken: TELEGRAM_TOKEN, chatId: '@watchdog_alerts' })).toBeTruthy();
    expect(() => ChannelConfigValidator.parse('TELEGRAM', { botToken: 'nope', chatId: '1234' })).toThrow(BadRequestException);
    expect(() => ChannelConfigValidator.parse('TELEGRAM', { botToken: TELEGRAM_TOKEN, chatId: 'me' })).toThrow(BadRequestException);
  });

  it('validates, lowercases and de-duplicates email recipients', () => {
    expect(ChannelConfigValidator.parse('EMAIL', { recipients: ['A@x.com', 'a@x.com', 'b@y.org'] })).toEqual({
      recipients: ['a@x.com', 'b@y.org'],
    });
    expect(() => ChannelConfigValidator.parse('EMAIL', { recipients: [] })).toThrow(BadRequestException);
    expect(() => ChannelConfigValidator.parse('EMAIL', { recipients: ['not-an-email'] })).toThrow(BadRequestException);
    expect(() => ChannelConfigValidator.parse('EMAIL', { recipients: Array.from({ length: 11 }, (_, i) => `u${i}@x.com`) })).toThrow(
      BadRequestException,
    );
  });

  it('builds hints that never reveal secrets', () => {
    const slackHint = ChannelConfigValidator.hint('SLACK', { webhookUrl: SLACK_URL });
    const telegramHint = ChannelConfigValidator.hint('TELEGRAM', { botToken: TELEGRAM_TOKEN, chatId: '-100123' });

    expect(slackHint).toBe('hooks.slack.com/…uvwx');
    expect(slackHint).not.toContain('T0000');
    expect(telegramHint).toBe('Chat -100123');
    expect(telegramHint).not.toContain(TELEGRAM_TOKEN);
  });
});

describe('senders', () => {
  it('posts a Slack message with escaped text and a link to the issue', async () => {
    const postJson = vi.fn().mockResolvedValue(undefined);
    const sender = new SlackSender({ postJson } as unknown as HttpPoster);

    await sender.send({ webhookUrl: SLACK_URL }, message);

    const [url, body] = postJson.mock.calls[0];
    expect(url).toBe(SLACK_URL);
    expect(JSON.stringify(body)).toContain('&lt;b&gt;x&lt;/b&gt; &amp; y');
    expect(JSON.stringify(body)).toContain(message.issueUrl);
  });

  it('posts a Discord embed without allowing mentions', async () => {
    const postJson = vi.fn().mockResolvedValue(undefined);
    const sender = new DiscordSender({ postJson } as unknown as HttpPoster);

    await sender.send({ webhookUrl: DISCORD_URL }, message);

    const [, body] = postJson.mock.calls[0] as [string, { allowed_mentions: unknown; embeds: { url: string; color: number }[] }];
    expect(body.allowed_mentions).toEqual({ parse: [] });
    expect(body.embeds[0].url).toBe(message.issueUrl);
    expect(body.embeds[0].color).toBe(0xf05a5a);
  });

  it('posts to the Telegram API with HTML escaped', async () => {
    const postJson = vi.fn().mockResolvedValue(undefined);
    const sender = new TelegramSender({ postJson } as unknown as HttpPoster);

    await sender.send({ botToken: TELEGRAM_TOKEN, chatId: '-100123' }, message);

    const [url, body] = postJson.mock.calls[0] as [string, { chat_id: string; text: string; parse_mode: string }];
    expect(url).toBe(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`);
    expect(body.parse_mode).toBe('HTML');
    expect(body.text).toContain('&lt;b&gt;x&lt;/b&gt; &amp; y');
    expect(body.text).not.toContain('<b>x</b>');
  });

  it('emails every recipient with the issue link', async () => {
    const sendMail = vi.fn().mockResolvedValue(undefined);
    const sender = new EmailSender({ sendMail } as never);

    await sender.send({ recipients: ['a@x.com', 'b@x.com'] }, message);

    const [recipients, subject, text] = sendMail.mock.calls[0];
    expect(recipients).toEqual(['a@x.com', 'b@x.com']);
    expect(subject).toBe('[Storefront] TypeError: <b>x</b> & y');
    expect(text).toContain(message.issueUrl);
  });
});

describe('SpikeDetector', () => {
  it('fires once the threshold is reached inside the window, then starts over', () => {
    const detector = new SpikeDetector();
    const start = 1_000_000;

    expect(detector.record('rule:issue', 3, 5, start)).toBeNull();
    expect(detector.record('rule:issue', 3, 5, start + 1_000)).toBeNull();
    expect(detector.record('rule:issue', 3, 5, start + 2_000)).toBe(3);
    expect(detector.record('rule:issue', 3, 5, start + 3_000)).toBeNull();
  });

  it('forgets counts that fall outside the window', () => {
    const detector = new SpikeDetector();
    const start = 1_000_000;

    detector.record('k', 3, 1, start);
    detector.record('k', 3, 1, start + 10_000);

    expect(detector.record('k', 3, 1, start + 120_000)).toBeNull();
  });

  it('tracks rule and issue pairs independently', () => {
    const detector = new SpikeDetector();

    detector.record('a', 2, 5, 1);

    expect(detector.record('b', 2, 5, 2)).toBeNull();
    expect(detector.record('a', 2, 5, 3)).toBe(2);
  });
});
