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

## Filters and cooldown

- **Minimum level** ignores anything quieter than the level you choose (`debug`, `info`, `warning`, `error`, `fatal`).
- **Environment** limits a rule to one environment such as `production`.
- **Cooldown** stops repeat alerts. After an alert for an issue, the same rule stays quiet for that issue until the cooldown ends. New issue alerts are sent once and ignore the cooldown.

## Delivery log

Every attempt is recorded in **Integrations → Recent deliveries**, including failures and the reason. If an alert did not arrive, look there first. A failing channel never blocks error collection.

## Spike detection and multiple servers

Spike counting happens in memory on the server that received the events. If you run several Watchdog servers behind a load balancer, each counts the events it sees, so the effective threshold is higher than configured.

## Security

- Webhook URLs and bot tokens are encrypted in the database with your `WATCHDOG_SECRET_KEY`.
- Webhook URLs must be on the provider's own domain. Watchdog refuses addresses such as `localhost` or private network hosts so it cannot be used to reach internal services.
- Only administrators can create, change or delete channels and rules.
