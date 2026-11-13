# Alerts overview

Alerts tell you about problems without you watching the dashboard. Setting them up takes two steps:

1. Add a **channel**: where alerts go (Slack, Discord, Telegram or email). Channels live in **Integrations** and are shared by every project.
2. Add a **rule** to a project: when to alert, and through which channels.

## Triggers

| Trigger | Fires when | Good for |
| --- | --- | --- |
| New issue | An error is seen for the first time | Catching new bugs after a release |
| Regression | An issue you marked resolved happens again | Finding fixes that did not hold |
| Spike | One issue reaches your event count inside your time window | Outages and runaway loops |
| Metric | A metric or transaction timing goes above or below a threshold over a time window | Slow voice replies, a growing queue, a drop in traffic |

## Metric alerts

A metric rule checks the data once a minute. You choose:

- **Data**: a custom metric, or transaction duration (all transactions, or one by name).
- **Summarize as**: average, sum, min, max, count, p50, p95, p99 or rate per second.
- **Alert when it**: goes above or drops below a **threshold**. Transaction durations are in milliseconds. Metrics use the unit you send.
- **Over the last N minutes**: the window the summary is calculated on, up to 24 hours.
- Optionally one **tag** and value, and an **environment**, to narrow it down.

Examples: `voice.latency` p95 goes above 2000 over the last 5 minutes. `queue.depth` max goes above 50 over the last 10 minutes. `calls.started` sum drops below 1 over the last 60 minutes.

When the condition is true, the alert is sent to the rule's channels, then the rule stays quiet for its **quiet period** (30 minutes by default) even if the condition holds. A window with no data never fires, so a drop to zero events is not detected by a "drops below" rule; send a gauge or count if you need that. The quiet period is tracked in the database, so it holds across several Watchdog servers.

## Filters and cooldown

- **Minimum level** ignores anything quieter than the level you choose (`debug`, `info`, `warning`, `error`, `fatal`).
- **Environment** limits a rule to one environment such as `production`.
- **Cooldown** stops repeat alerts. After an alert for an issue, the same rule stays quiet for that issue until the cooldown ends. New issue alerts are sent once and ignore the cooldown. Metric rules stay quiet for the whole rule instead.

## Delivery log

Every attempt is recorded in **Integrations → Recent deliveries**, including failures and the reason. If an alert did not arrive, look there first. A failing channel never blocks error collection.

## Spike detection and multiple servers

Spike counting happens in memory on the server that received the events. If you run several Watchdog servers behind a load balancer, each counts the events it sees, so the effective threshold is higher than configured.

## Security

- Webhook URLs and bot tokens are encrypted in the database with your `WATCHDOG_SECRET_KEY`.
- Webhook URLs must be on the provider's own domain. Watchdog refuses addresses such as `localhost` or private network hosts so it cannot be used to reach internal services.
- Only administrators can create, change or delete channels and rules.
