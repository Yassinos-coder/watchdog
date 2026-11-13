# Webhooks

A webhook sends a signed JSON request to an address you choose whenever something happens in Watchdog. Use it to feed your own tools, bots or automations.

## Add a webhook

1. Open **Integrations → Webhooks** and select **Add webhook**.
2. Enter a name, an `https://` address and the events you want.
3. Copy the **signing secret**. It is shown once.

Select **Send test** on a webhook to send a `webhook.test` delivery and see the result straight away. Each webhook keeps its recent deliveries, with the status and any error.

## Events

| Event | Sent when |
| --- | --- |
| `issue.new` | An error is seen for the first time |
| `issue.regression` | An issue you resolved happens again |
| `issue.spike` | An issue reaches the count of a spike alert rule within its window |
| `metric.alert` | A metric or timing crosses the threshold of a metric alert rule |
| `watchdog.restarting` | Watchdog is about to stop for an update or restart |
| `watchdog.online` | Watchdog is back, with the version and whether each watched app is sending data |

`issue.spike` and `metric.alert` follow your [alert rules](alerts/overview.md), so create a rule for them first. The other events need no rule.

## What a delivery looks like

```json
{
  "id": "0b3f5c0e-...",
  "type": "issue.new",
  "createdAt": "2026-11-13T16:04:16.510Z",
  "data": {
    "project": { "id": "...", "name": "Shop API" },
    "issue": { "id": "...", "title": "TypeError: ...", "culprit": "...", "level": "error", "status": "UNRESOLVED", "eventCount": 1 },
    "environment": "production",
    "release": "1.4.0"
  }
}
```

Headers sent with every request:

| Header | Value |
| --- | --- |
| `x-watchdog-event` | The event type |
| `x-watchdog-delivery` | A unique id for this delivery |
| `x-watchdog-signature` | `t=<unix seconds>,v1=<hex hmac>` |

## Check the signature

The signature is an HMAC-SHA256, keyed with your signing secret, of the timestamp, a dot and the raw request body. Reject requests whose timestamp is more than a few minutes old.

```js
import { createHmac, timingSafeEqual } from 'node:crypto';

function isFromWatchdog(secret, header, rawBody) {
  const parts = Object.fromEntries(header.split(',').map((part) => part.split('=')));
  const expected = createHmac('sha256', secret).update(`${parts.t}.${rawBody}`).digest('hex');
  return timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1));
}
```

## Delivery and safety

- Answer with any `2xx` status within 8 seconds. A `5xx`, `429` or network failure is tried once more after a second. Other statuses are not retried.
- Only `https://` addresses on the public internet are allowed. Addresses such as `localhost` and private networks are refused so Watchdog cannot be pointed at your internal services.
- Use **New signing secret** on a webhook if a secret leaks. The old one stops working at once.
- Only administrators can add, change or delete webhooks.
