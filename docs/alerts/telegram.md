# Telegram

Telegram alerts come from a bot that you create.

## Create a bot

1. In Telegram, open a chat with [@BotFather](https://t.me/BotFather) and send `/newbot`.
2. Choose a name and a username ending in `bot`.
3. Copy the **bot token**. It looks like `123456789:AAH...`.

## Find the chat ID

- **Private chat with you**: send any message to your bot, then open `https://api.telegram.org/bot<token>/getUpdates` in a browser and read `chat.id`.
- **Group**: add the bot to the group, send a message, and read `chat.id` from `getUpdates`. Group IDs are negative, for example `-1001234567890`.
- **Public channel**: add the bot as an administrator and use the channel name, for example `@my_alerts`.

## Add it to Watchdog

1. Open **Integrations** and choose **Add channel → Telegram**.
2. Paste the bot token and chat ID, and give the channel a name.
3. Select **Send test** to check that a message arrives.

## Troubleshooting

- **401 Unauthorized**: the token is wrong or was revoked in BotFather.
- **400 chat not found**: the bot has not been added to the chat, or nobody has sent it a message yet.
- Your bot token is stored encrypted and is never shown again after you save it.
