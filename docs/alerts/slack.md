# Slack

Watchdog posts to Slack through an **incoming webhook**. You do not need to publish an app.

## Create a webhook

1. Open <https://api.slack.com/apps> and choose **Create New App → From scratch**. Name it "Watchdog" and pick your workspace.
2. In the app, open **Incoming Webhooks** and switch **Activate Incoming Webhooks** on.
3. Choose **Add New Webhook to Workspace**, pick the channel for alerts, and allow it.
4. Copy the **Webhook URL**. It starts with `https://hooks.slack.com/services/`.

## Add it to Watchdog

1. Open **Integrations** and choose **Add channel → Slack**.
2. Paste the webhook URL and give the channel a name.
3. Select **Send test** to check that a message arrives.

## Troubleshooting

- **`no_service` or 404**: the webhook was removed or revoked. Create a new one.
- **`invalid_token`**: the URL was copied incompletely. Copy the whole URL.
- **Test works but real alerts do not**: check that a [rule](overview.md) uses this channel and that the rule's level and environment match your events. See **Recent deliveries**.
