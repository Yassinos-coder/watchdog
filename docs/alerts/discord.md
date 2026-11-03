# Discord

Watchdog posts to Discord through a **channel webhook**.

## Create a webhook

1. In Discord, open the settings of the channel that should receive alerts (**Edit Channel**).
2. Choose **Integrations → Webhooks → New Webhook**.
3. Name it "Watchdog", then choose **Copy Webhook URL**. It starts with `https://discord.com/api/webhooks/`.

You need the **Manage Webhooks** permission on that channel.

## Add it to Watchdog

1. Open **Integrations** and choose **Add channel → Discord**.
2. Paste the webhook URL and give the channel a name.
3. Select **Send test** to check that a message arrives.

## Troubleshooting

- **404 Unknown Webhook**: the webhook was deleted. Create a new one.
- **429**: Discord is rate limiting the channel. Use a longer [cooldown](overview.md) on your rules.
- Alerts never mention `@everyone` or roles, even if the error message contains them.
