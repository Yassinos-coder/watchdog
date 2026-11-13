# MCP: connect an AI assistant

> **Don't set it up. Just ask.** Tell Claude *"Use Watchdog to set up error tracking in this repo"* and it creates the project, installs the SDK, adds the init code and writes your keys to `.env`. Later: *"Look at the latest issue in my backend and fix it."*

Watchdog has a built-in [Model Context Protocol](https://modelcontextprotocol.io) server. Connect an assistant such as Claude Code, and you can say things like:

- "Use Watchdog to look at the latest issue in WePickUp Backend, find the code that caused it and fix it."
- "Which transactions got slower this week?"
- "Set up Watchdog in this repo and write the keys to my `.env` file."

The assistant reads the issue, its stack trace mapped back to your original source files with the code around each line, the breadcrumbs of what happened before the error, the request, the release and the environment. It never needs a login: it uses an API key you create and control.

## Turn it on

1. Open **Integrations → MCP**.
2. Copy the **server address**. Watchdog builds it from your own address, for example `https://watchdog.example.com/api/mcp`.
3. Select **Create API key**, give it a name, and choose what it may do.
4. Copy the key. It is shown once.

## Connect Claude Code

```bash
claude mcp add --transport http watchdog https://watchdog.example.com/api/mcp \
  --header "Authorization: Bearer wdmcp_your_key"
```

Other assistants that read an MCP config file (Cursor, Windsurf, VS Code and others) take the same two values:

```json
{
  "mcpServers": {
    "watchdog": {
      "type": "http",
      "url": "https://watchdog.example.com/api/mcp",
      "headers": { "Authorization": "Bearer wdmcp_your_key" }
    }
  }
}
```

## What a key can do

Each key has its own permissions, and a tool the key may not use is not offered to the assistant at all.

| Permission | Tools |
| --- | --- |
| See projects | `list_projects` |
| Read issues | `get_latest_issue`, `list_issues`, `get_issue`, `list_issue_events`, `get_project_stats` |
| Read performance and metrics | `transactions_summary`, `list_metrics`, `query_series`, `list_dashboards` |
| Read alert rules | `list_alert_rules` |
| Change issue status | `update_issue_status` |
| Set up projects and credentials | `create_project`, `get_project_setup`, `rotate_upload_token` |

Wherever a tool takes a project, you can pass its name (`WePickUp Backend`), its slug or its id.

New keys start with the read permissions on. **Change issue status** and **Set up projects and credentials** are off until you choose them, because they can change things or hand out credentials.

## Letting an assistant set up your apps

With **Set up projects and credentials** on, an assistant can create a project and write the settings your app needs: the DSN, the Watchdog address, the project id and a source map upload token, along with the SDK install command and init code for your platform. Things to know:

- The **DSN** is meant to ship inside client apps, so it is not a secret.
- The **upload token** is a secret. It only allows uploading source maps, and it cannot be read back later. `rotate_upload_token` creates a new one and the old one stops working.
- Give this permission to a key you use for setup, then edit the key to remove the permission, or delete it.

## Keeping it safe

- Watchdog stores only a fingerprint of each key, so a lost key cannot be recovered. Create a new one.
- Delete a key to cut off access immediately. Editing permissions takes effect on the next request.
- A key never gives access to your login, passkeys, team or other settings.
- Treat a key like a password. Anything an assistant reads comes from your error data, so only connect assistants you trust with it.
